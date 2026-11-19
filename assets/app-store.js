/* Multi-User Local Storage Engine for SPPU SE Exam Studio */
(function (global) {
  "use strict";

  const STORAGE_KEY = "sppu_exam_studio_v1";
  const THEMES = ["light", "warm", "dark"];
  const THEME_COLORS = { light: "#F8F9FB", warm: "#EFE4DC", dark: "#111215" };
  const AVATAR_PALETTE = [
    "#C2CBFA",
    "#EADB86",
    "#C6DFD7",
    "#F0C6B9",
    "#D3DEC2",
    "#C7DDF4",
  ];
  const CONF_ORDER = ["unseen", "revise", "good", "mastered"];

  const listeners = new Set();

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function todayKey(dateObj) {
    const d = dateObj || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }

  function defaultPlanClone() {
    const src = (global.EXAM_DATA && global.EXAM_DATA.defaultPlanTasks) || {};
    return clone(src);
  }

  function createEmptyUser(name, avatarColor, idOverride) {
    return {
      id: idOverride || uid("usr"),
      name: (name || "Student").trim().slice(0, 32) || "Student",
      avatarColor: avatarColor || AVATAR_PALETTE[0],
      createdAt: new Date().toISOString(),
      topics: {},
      papers: {},
      bookmarks: [],
      notes: {},
      moodLog: {},
      studyLog: {},
      planTasks: defaultPlanClone(),
      preferences: {
        pattern: "revised",
        branch: "CSE",
        includeSem4: false,
        theme: "light",
      },
    };
  }

  function normalizeUser(user) {
    if (!user || typeof user !== "object") return createEmptyUser("Student");
    if (!user.topics) user.topics = {};
    if (!user.papers) user.papers = {};
    if (!Array.isArray(user.bookmarks)) user.bookmarks = [];
    if (!user.notes) user.notes = {};
    if (!user.moodLog) user.moodLog = {};
    if (!user.studyLog) user.studyLog = {};
    if (!user.planTasks || Object.keys(user.planTasks).length === 0) {
      user.planTasks = defaultPlanClone();
    }
    if (!user.preferences) {
      user.preferences = { pattern: "revised", branch: "CSE", includeSem4: false, theme: "light" };
    }
    if (!THEMES.includes(user.preferences.theme)) {
      user.preferences.theme = "light";
    }
    if (!user.avatarColor) user.avatarColor = AVATAR_PALETTE[0];
    return user;
  }

  function loadState() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.users && Object.keys(parsed.users).length > 0) {
          Object.keys(parsed.users).forEach((k) => {
            parsed.users[k] = normalizeUser(parsed.users[k]);
          });
          if (!parsed.activeUserId || !parsed.users[parsed.activeUserId]) {
            parsed.activeUserId = Object.keys(parsed.users)[0];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("ExamStore: failed reading localStorage", e);
    }
    const defaultUser = createEmptyUser("Student", AVATAR_PALETTE[0], "usr_default");
    const fresh = {
      version: 1,
      activeUserId: defaultUser.id,
      users: { [defaultUser.id]: defaultUser },
    };
    saveState(fresh, true);
    return fresh;
  }

  function saveState(state, silent) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("ExamStore: failed saving localStorage", e);
    }
    if (!silent) notify();
  }

  let state = loadState();

  function applyTheme(themeOverride) {
    const active = getActiveUser();
    const raw = themeOverride || (active && active.preferences && active.preferences.theme) || "light";
    const theme = THEMES.includes(raw) ? raw : "light";
    if (global.document && global.document.documentElement) {
      global.document.documentElement.dataset.theme = theme;
      const meta = global.document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.light);
    }
    return theme;
  }

  function cycleTheme() {
    const cur = applyTheme();
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    updatePreferences({ theme: next });
    return next;
  }

  function notify() {
    applyTheme();
    listeners.forEach((fn) => {
      try {
        fn(getSnapshot());
      } catch (e) {
        console.error(e);
      }
    });
  }

  applyTheme();

  global.addEventListener("storage", (ev) => {
    if (ev.key === STORAGE_KEY) {
      state = loadState();
      applyTheme();
      notify();
    }
  });

  function getSnapshot() {
    return state;
  }

  function getActiveUser() {
    const u = state.users[state.activeUserId];
    if (u) return u;
    const firstKey = Object.keys(state.users)[0];
    state.activeUserId = firstKey;
    return state.users[firstKey];
  }

  function getUsers() {
    return Object.values(state.users);
  }

  function createUser(name, avatarColor) {
    const clean = (name || "").trim();
    if (!clean) return null;
    const usedCount = Object.keys(state.users).length;
    const color = avatarColor || AVATAR_PALETTE[usedCount % AVATAR_PALETTE.length];
    const u = createEmptyUser(clean, color);
    state.users[u.id] = u;
    state.activeUserId = u.id;
    saveState(state);
    return u;
  }

  function switchUser(userId) {
    if (!state.users[userId]) return false;
    state.activeUserId = userId;
    saveState(state);
    return true;
  }

  function renameUser(userId, newName) {
    const u = state.users[userId];
    const clean = (newName || "").trim().slice(0, 32);
    if (!u || !clean) return false;
    u.name = clean;
    saveState(state);
    return true;
  }

  function deleteUser(userId) {
    const ids = Object.keys(state.users);
    if (ids.length <= 1 || !state.users[userId]) return false;
    delete state.users[userId];
    if (state.activeUserId === userId) {
      state.activeUserId = Object.keys(state.users)[0];
    }
    saveState(state);
    return true;
  }

  // Topic progress
  function getTopicState(subId, topicId) {
    const u = getActiveUser();
    const rec = u.topics[subId] && u.topics[subId][topicId];
    return rec || { done: false, confidence: "unseen", updatedAt: null };
  }

  function toggleTopicDone(subId, topicId, forceVal) {
    const u = getActiveUser();
    if (!u.topics[subId]) u.topics[subId] = {};
    const cur = u.topics[subId][topicId] || { done: false, confidence: "unseen" };
    const nextDone = typeof forceVal === "boolean" ? forceVal : !cur.done;
    let nextConf = cur.confidence || "unseen";
    if (nextDone && nextConf === "unseen") nextConf = "good";
    if (!nextDone && nextConf === "mastered") nextConf = "revise";
    u.topics[subId][topicId] = {
      done: nextDone,
      confidence: nextConf,
      updatedAt: new Date().toISOString(),
    };
    saveState(state);
    return u.topics[subId][topicId];
  }

  function setTopicConfidence(subId, topicId, level) {
    if (!CONF_ORDER.includes(level)) return;
    const u = getActiveUser();
    if (!u.topics[subId]) u.topics[subId] = {};
    const cur = u.topics[subId][topicId] || { done: false, confidence: "unseen" };
    u.topics[subId][topicId] = {
      done: level === "good" || level === "mastered" ? true : cur.done,
      confidence: level,
      updatedAt: new Date().toISOString(),
    };
    saveState(state);
    return u.topics[subId][topicId];
  }

  function cycleTopicConfidence(subId, topicId) {
    const cur = getTopicState(subId, topicId);
    const idx = CONF_ORDER.indexOf(cur.confidence || "unseen");
    const next = CONF_ORDER[(idx + 1) % CONF_ORDER.length];
    return setTopicConfidence(subId, topicId, next);
  }

  function markUnitDone(subId, unitId, doneVal) {
    const sub = (global.EXAM_DATA && global.EXAM_DATA.subjects || []).find((s) => s.id === subId);
    if (!sub) return;
    const unit = sub.units.find((un) => un.id === unitId);
    if (!unit) return;
    const u = getActiveUser();
    if (!u.topics[subId]) u.topics[subId] = {};
    const now = new Date().toISOString();
    unit.topics.forEach((t) => {
      const cur = u.topics[subId][t.id] || { done: false, confidence: "unseen" };
      u.topics[subId][t.id] = {
        done: doneVal,
        confidence: doneVal ? (cur.confidence === "unseen" ? "good" : cur.confidence) : "unseen",
        updatedAt: now,
      };
    });
    saveState(state);
  }

  // Papers
  function isPaperDone(href) {
    const u = getActiveUser();
    return Boolean(u.papers[href] && u.papers[href].done);
  }

  function togglePaperDone(href) {
    const u = getActiveUser();
    const cur = Boolean(u.papers[href] && u.papers[href].done);
    u.papers[href] = { done: !cur, updatedAt: new Date().toISOString() };
    saveState(state);
    return u.papers[href].done;
  }

  // Bookmarks
  function isBookmarked(subId, topicId) {
    const u = getActiveUser();
    return u.bookmarks.some((b) => b.subId === subId && b.topicId === topicId);
  }

  function toggleBookmark(item) {
    const u = getActiveUser();
    const idx = u.bookmarks.findIndex((b) => b.subId === item.subId && b.topicId === item.topicId);
    if (idx >= 0) {
      u.bookmarks.splice(idx, 1);
      saveState(state);
      return false;
    }
    u.bookmarks.unshift({
      subId: item.subId,
      topicId: item.topicId,
      title: item.title,
      href: item.href,
      addedAt: new Date().toISOString(),
    });
    saveState(state);
    return true;
  }

  function getBookmarks() {
    return getActiveUser().bookmarks;
  }

  // Notes
  function getNote(subId) {
    return getActiveUser().notes[subId] || "";
  }

  function setNote(subId, text) {
    const u = getActiveUser();
    u.notes[subId] = text;
    saveState(state);
  }

  // Mood Log
  function getMood(dateKey) {
    const k = dateKey || todayKey();
    return getActiveUser().moodLog[k] || null;
  }

  function setMood(dateKey, moodId, reflection) {
    const u = getActiveUser();
    const k = dateKey || todayKey();
    const prev = u.moodLog[k] || {};
    u.moodLog[k] = {
      mood: moodId !== undefined ? moodId : prev.mood || "good",
      reflection: reflection !== undefined ? reflection : prev.reflection || "",
      updatedAt: new Date().toISOString(),
    };
    saveState(state);
    return u.moodLog[k];
  }

  function getRecentMoods(limit) {
    const u = getActiveUser();
    return Object.entries(u.moodLog)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, limit || 10)
      .map(([date, val]) => Object.assign({ date }, val));
  }

  // Study Time Log
  function logStudyMinutes(minutes, subId, dateKey) {
    const mins = Math.max(1, Math.round(Number(minutes) || 0));
    if (!mins) return;
    const u = getActiveUser();
    const k = dateKey || todayKey();
    if (!u.studyLog[k]) u.studyLog[k] = { minutes: 0, bySubject: {} };
    u.studyLog[k].minutes += mins;
    if (subId) {
      u.studyLog[k].bySubject[subId] = (u.studyLog[k].bySubject[subId] || 0) + mins;
    }
    saveState(state);
  }

  function getTotalStudyMinutes() {
    const u = getActiveUser();
    return Object.values(u.studyLog).reduce((acc, d) => acc + (d.minutes || 0), 0);
  }

  function getWeeklyStudyData(mode) {
    const u = getActiveUser();
    const days = mode === "M" ? 14 : mode === "All" ? 21 : 7;
    const out = [];
    const base = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const k = todayKey(d);
      const entry = u.studyLog[k] || { minutes: 0, bySubject: {} };
      out.push({
        date: k,
        shortDay: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
        dayNum: d.getDate(),
        minutes: entry.minutes || 0,
        bySubject: entry.bySubject || {},
      });
    }
    return out;
  }

  // Plan Tasks
  function getPlanTasks(dateKey) {
    const u = getActiveUser();
    return u.planTasks[dateKey] || [];
  }

  function togglePlanTask(dateKey, taskId) {
    const u = getActiveUser();
    const list = u.planTasks[dateKey] || [];
    const item = list.find((t) => t.id === taskId);
    if (item) {
      item.done = !item.done;
      saveState(state);
    }
  }

  function addPlanTask(dateKey, text, subId) {
    const clean = (text || "").trim();
    if (!clean) return null;
    const u = getActiveUser();
    if (!u.planTasks[dateKey]) u.planTasks[dateKey] = [];
    const task = { id: uid("pt"), subId: subId || "ds", text: clean, done: false };
    u.planTasks[dateKey].push(task);
    saveState(state);
    return task;
  }

  function deletePlanTask(dateKey, taskId) {
    const u = getActiveUser();
    if (!u.planTasks[dateKey]) return;
    u.planTasks[dateKey] = u.planTasks[dateKey].filter((t) => t.id !== taskId);
    saveState(state);
  }

  function resetDefaultPlan() {
    const u = getActiveUser();
    u.planTasks = defaultPlanClone();
    saveState(state);
  }

  // Preferences
  function getPreferences() {
    return getActiveUser().preferences;
  }

  function updatePreferences(patch) {
    const u = getActiveUser();
    u.preferences = Object.assign({}, u.preferences, patch);
    saveState(state);
    return u.preferences;
  }

  // Stats
  function getSubjectStats(subId) {
    const u = getActiveUser();
    const data = global.EXAM_DATA;
    if (!data) return { done: 0, total: 0, pct: 0, mastered: 0, good: 0, revise: 0, practicedPapers: 0, totalPapers: 0, minutes: 0 };
    const sub = data.subjects.find((s) => s.id === subId);
    if (!sub) return { done: 0, total: 0, pct: 0, mastered: 0, good: 0, revise: 0, practicedPapers: 0, totalPapers: 0, minutes: 0 };

    let total = 0;
    let done = 0;
    let mastered = 0;
    let good = 0;
    let revise = 0;

    sub.units.forEach((un) => {
      un.topics.forEach((t) => {
        total += 1;
        const st = getTopicState(subId, t.id);
        if (st.done) done += 1;
        if (st.confidence === "mastered") mastered += 1;
        else if (st.confidence === "good") good += 1;
        else if (st.confidence === "revise") revise += 1;
      });
    });

    const subPdfs = (data.pdfs || []).filter((p) => p.subject === subId);
    const practicedPapers = subPdfs.filter((p) => isPaperDone(p.href)).length;
    const minutes = Object.values(u.studyLog).reduce(
      (acc, d) => acc + ((d.bySubject && d.bySubject[subId]) || 0),
      0
    );

    return {
      done,
      total,
      pct: total ? Math.round((done / total) * 100) : 0,
      mastered,
      good,
      revise,
      practicedPapers,
      totalPapers: subPdfs.length,
      minutes,
    };
  }

  function getOverallStats(includeSem4Override) {
    const data = global.EXAM_DATA;
    const u = getActiveUser();
    if (!data) return { done: 0, total: 0, pct: 0, practicedPapers: 0, totalPapers: 0, totalMinutes: 0, activeDays: 0 };
    const incSem4 = typeof includeSem4Override === "boolean" ? includeSem4Override : Boolean(u.preferences.includeSem4);
    const subs = data.subjects.filter((s) => incSem4 || !s.isSem4);

    let done = 0;
    let total = 0;
    subs.forEach((s) => {
      const st = getSubjectStats(s.id);
      done += st.done;
      total += st.total;
    });

    const allPdfs = data.pdfs || [];
    const practicedPapers = allPdfs.filter((p) => isPaperDone(p.href)).length;
    const totalMinutes = getTotalStudyMinutes();
    const activeDays = Object.keys(u.studyLog).filter((k) => (u.studyLog[k].minutes || 0) > 0).length;

    return {
      done,
      total,
      pct: total ? Math.round((done / total) * 100) : 0,
      practicedPapers,
      totalPapers: allPdfs.length,
      totalMinutes,
      activeDays,
    };
  }

  function exportAllJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importAllJSON(rawText) {
    const parsed = JSON.parse(rawText);
    if (!parsed || !parsed.users || typeof parsed.users !== "object") {
      throw new Error("Invalid backup file format");
    }
    Object.keys(parsed.users).forEach((k) => {
      parsed.users[k] = normalizeUser(parsed.users[k]);
    });
    if (!parsed.activeUserId || !parsed.users[parsed.activeUserId]) {
      parsed.activeUserId = Object.keys(parsed.users)[0];
    }
    state = parsed;
    saveState(state);
    return true;
  }

  function resetActiveUserProgress() {
    const u = getActiveUser();
    const fresh = createEmptyUser(u.name, u.avatarColor, u.id);
    state.users[u.id] = fresh;
    saveState(state);
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  global.ExamStore = {
    AVATAR_PALETTE,
    CONF_ORDER,
    THEMES,
    todayKey,
    applyTheme,
    cycleTheme,
    getSnapshot,
    getUsers,
    getActiveUser,
    createUser,
    switchUser,
    renameUser,
    deleteUser,
    getTopicState,
    toggleTopicDone,
    setTopicConfidence,
    cycleTopicConfidence,
    markUnitDone,
    isPaperDone,
    togglePaperDone,
    isBookmarked,
    toggleBookmark,
    getBookmarks,
    getNote,
    setNote,
    getMood,
    setMood,
    getRecentMoods,
    logStudyMinutes,
    getTotalStudyMinutes,
    getWeeklyStudyData,
    getPlanTasks,
    togglePlanTask,
    addPlanTask,
    deletePlanTask,
    resetDefaultPlan,
    getPreferences,
    updatePreferences,
    getSubjectStats,
    getOverallStats,
    exportAllJSON,
    importAllJSON,
    resetActiveUserProgress,
    subscribe,
  };
})(window);
