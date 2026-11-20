/* SPPU SE Exam Studio — Interactive Portal Application (Laptop + Mobile, 3-Theme, Zero Emoji) */
(function (global) {
  "use strict";

  const DATA = global.EXAM_DATA;
  const Store = global.ExamStore;

  if (Store && Store.applyTheme) {
    Store.applyTheme();
  }

  const uiState = {
    tab: "home",
    selectedSubjectId: "ds",
    openUnits: {},
    pyqSubject: "all",
    pyqSection: "all",
    pyqQuery: "",
    collapsedPdfSecs: {},
    chartRange: "W",
    planFilter: "upcoming",
    searchQuery: "",
  };

  let timerState = {
    totalSecs: 25 * 60,
    leftSecs: 25 * 60,
    running: false,
    subId: "ds",
    intervalId: null,
  };

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  const ICONS = {
    arrowNE: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>`,
    book: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    calendar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    clock: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>`,
    fileText: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>`,
    layers: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    checkCircle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
    warm: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" opacity="0.28"/></svg>`,
    moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  };

  const THEME_LABELS = { light: "Light", warm: "Warm", dark: "Dark" };

  const MOODS = [
    {
      id: "great",
      label: "Peak",
      bg: "#EADB86",
      svg: `<svg viewBox="0 0 36 36" width="24" height="24"><circle cx="12.5" cy="14" r="1.7" fill="#171717"/><circle cx="23.5" cy="14" r="1.7" fill="#171717"/><path d="M11 20.5c1.8 3.6 12.2 3.6 14 0" fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/><path d="M10.5 20.5h15" fill="none" stroke="#171717" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    },
    {
      id: "calm",
      label: "Calm",
      bg: "#9CAF7E",
      svg: `<svg viewBox="0 0 36 36" width="24" height="24"><path d="M10.5 15c1.2-1.2 2.8-1.2 4 0M21.5 15c1.2-1.2 2.8-1.2 4 0" fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/><path d="M13.5 21.5c2 1.8 7 1.8 9 0" fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    },
    {
      id: "stressed",
      label: "Tense",
      bg: "#E68D74",
      svg: `<svg viewBox="0 0 36 36" width="24" height="24"><path d="M10 12.5l4.5 2M26 12.5l-4.5 2" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/><circle cx="12.5" cy="16.5" r="1.5" fill="#171717"/><circle cx="23.5" cy="16.5" r="1.5" fill="#171717"/><path d="M13 23.5c2-2 8-2 10 0" fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    },
    {
      id: "focused",
      label: "Focused",
      bg: "#8FB5E6",
      svg: `<svg viewBox="0 0 36 36" width="24" height="24"><circle cx="12.5" cy="15" r="1.7" fill="#171717"/><circle cx="23.5" cy="15" r="1.7" fill="#171717"/><path d="M13 21.5c1.8 2 8.2 2 10 0" fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/><path d="M25 8l1 2.2 2.2.4-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.4z" fill="none" stroke="#171717" stroke-width="1.2"/></svg>`,
    },
    {
      id: "tired",
      label: "Tired",
      bg: "#EFE4DC",
      svg: `<svg viewBox="0 0 36 36" width="24" height="24"><path d="M10.5 16c1.3 1 2.7 1 4 0M21.5 16c1.3 1 2.7 1 4 0" fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/><circle cx="18" cy="22.5" r="2.2" fill="none" stroke="#171717" stroke-width="1.7"/></svg>`,
    },
    {
      id: "anxious",
      label: "Anxious",
      bg: "#B5B3E8",
      svg: `<svg viewBox="0 0 36 36" width="24" height="24"><path d="M10 13.5l4 1.5M26 13.5l-4 1.5" stroke="#171717" stroke-width="1.7" stroke-linecap="round"/><circle cx="12.5" cy="16.5" r="1.4" fill="#171717"/><circle cx="23.5" cy="16.5" r="1.4" fill="#171717"/><path d="M13 23.5c1.5-1.5 3-1.5 5 0s3.5 1.5 5 0" fill="none" stroke="#171717" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    },
  ];

  const BENTO_ARTS = {
    ds: `<svg class="bento-art" viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="45" cy="18" r="8"/><circle cx="24" cy="48" r="8"/><circle cx="66" cy="48" r="8"/><circle cx="16" cy="74" r="6"/><circle cx="36" cy="74" r="6"/><path d="M39 24L29 41M51 24L61 41M21 56L17 68M27 56L34 68"/></svg>`,
    oopcg: `<svg class="bento-art" viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="45,14 72,28 72,58 45,72 18,58 18,28"/><polyline points="18,28 45,42 72,28"/><line x1="45" y1="42" x2="45" y2="72"/><circle cx="66" cy="20" r="5"/></svg>`,
    os: `<svg class="bento-art" viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="24" y="24" width="42" height="42" rx="10"/><rect x="35" y="35" width="20" height="20" rx="5"/><path d="M36 14v10M54 14v10M36 66v10M54 66v10M14 36h10M14 54h10M66 36h10M66 54h10"/></svg>`,
    deld: `<svg class="bento-art" viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M24 22h18a18 18 0 0 1 0 36H24V22z"/><line x1="12" y1="32" x2="24" y2="32"/><line x1="12" y1="48" x2="24" y2="48"/><line x1="60" y1="40" x2="76" y2="40"/><polyline points="16,74 28,74 28,64 44,64 44,74 58,74 58,64 74,64"/></svg>`,
    uhv: `<svg class="bento-art" viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M45 74V36"/><path d="M45 58c-14 0-22-9-22-21 12 0 22 8 22 21z"/><path d="M45 48c14 0 22-9 22-21-12 0-22 8-22 21z"/><circle cx="45" cy="22" r="7"/></svg>`,
    dm: `<svg class="bento-art" viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M16 24h58L52 50v20l-14 6V50L16 24z"/><circle cx="34" cy="14" r="3"/><circle cx="54" cy="14" r="2"/></svg>`,
  };

  // Document-type grouping for the PDF library
  const PDF_SECTIONS = [
    { id: "syllabus",  title: "Syllabus & Official Timetable",                  sub: "Official NEP 2024 curriculum & Winter 2026 exam timetable", icon: "calendar" },
    { id: "qpapers24", title: "Question Papers (2024 Pattern — End-Sem)",       sub: "Core Computer Engg / CSE & allied branch Oct 2025 papers", icon: "fileText" },
    { id: "qbanks",    title: "Question Banks & Viva Prep",                     sub: "SPPU Official QB, PVG, SKN Sinhgad, SB Patil, Ajit & Viva QBs", icon: "layers" },
    { id: "solved",    title: "Solved Papers, Assignments & Notes",             sub: "Solved PYQs, Assignment solutions, In-Sem papers & notes", icon: "checkCircle" },
    { id: "qpapers19", title: "Previous Year Question Papers (2019 Pattern)",   sub: "8 exam sessions from Apr 2022 to Oct 2025 for extra practice", icon: "book" },
  ];

  function getPdfSectionId(pdf) {
    if (pdf.category === "Official Syllabus & Timetable") return "syllabus";
    if (pdf.category === "Primary 2024 End-Sem" || pdf.category === "Allied Branches 2024") return "qpapers24";
    if (pdf.category === "2019 Pattern PYQs") return "qpapers19";
    const lower = pdf.title.toLowerCase();
    if (
      pdf.category === "Solved & In-Sem Papers" ||
      lower.includes("assignment") ||
      lower.includes("insem") ||
      lower.includes("solved")
    ) {
      return "solved";
    }
    return "qbanks";
  }

  function getExamCountdown(sub) {
    const start = new Date(`${sub.examDate}T14:00:00+05:30`);
    const end = new Date(`${sub.examDate}T${sub.durationHrs === 2 ? "16:00:00" : "16:30:00"}+05:30`);
    const now = new Date();
    if (now > end) return { label: "Completed", past: true, diffMs: -1 };
    if (now >= start && now <= end) return { label: "In Exam", past: false, diffMs: 0 };
    const diff = start - now;
    const days = Math.floor(diff / 86400000);
    const hrs = Math.floor((diff % 86400000) / 3600000);
    if (days >= 1) return { label: `${days}d ${hrs}h left`, past: false, diffMs: diff };
    const mins = Math.floor((diff % 3600000) / 60000);
    return { label: `${hrs}h ${mins}m left`, past: false, diffMs: diff };
  }

  function getVisibleSubjects() {
    return DATA.subjects || [];
  }

  function getNextExamSubject() {
    const subs = getVisibleSubjects();
    const upcoming = subs
      .map((s) => ({ sub: s, cd: getExamCountdown(s) }))
      .filter((x) => !x.cd.past)
      .sort((a, b) => a.cd.diffMs - b.cd.diffMs);
    return upcoming[0] || { sub: subs[0], cd: getExamCountdown(subs[0]) };
  }

  function formatDateHeading(iso) {
    const d = new Date(`${iso}T00:00:00+05:30`);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }

  function renderDotMatrix(pct) {
    const totalDots = 30;
    const filledDots = Math.round((pct / 100) * totalDots);
    const palette = ["#81A89B", "#798CE8", "#CFA829"];
    let html = "";
    for (let i = 0; i < totalDots; i++) {
      const filled = i < filledDots;
      const col = palette[Math.floor(i / 10) % palette.length];
      html += `<span class="dot-cell ${filled ? "filled" : ""}" style="${filled ? `background:${col}` : ""}"></span>`;
    }
    return html;
  }

  function renderHome() {
    const user = Store.getActiveUser();
    const overall = Store.getOverallStats();
    const next = getNextExamSubject();
    const today = Store.todayKey();
    const todayMood = Store.getMood(today) || { mood: "", reflection: "" };
    const subs = getVisibleSubjects();
    const bookmarks = Store.getBookmarks();
    const greetingName = esc(user.name.split(" ")[0]);
    const solvedQbSubs = subs.filter((s) => Boolean(s.solvedQbHref));
    const totalTopicsCount = subs.reduce((acc, s) => acc + (s.totalTopics || 0), 0);

    return `
      <div class="hero-strip">
        <section class="hero-card">
          <div class="hero-top-meta">
            <span class="eyebrow">SPPU Winter 2026 &bull; NEP 2024</span>
            <button class="countdown-pill" data-action="go-tab" data-tab="timetable" type="button" title="View exam timetable">
              <span class="countdown-dot"></span>
              Next: ${esc(next.sub.short)} &middot; ${esc(next.cd.label)}
            </button>
          </div>
          <h1 class="display-heading">Hello, ${greetingName} &mdash;<br>Ready to master <strong>your exams?</strong></h1>
          <div class="hero-search-pill" data-action="open-search" role="button" tabindex="0">
            <input type="text" placeholder="Search ${totalTopicsCount} topics, formulas, or ${DATA.pdfs.length} PDFs..." readonly />
            <button class="pill-arrow-btn" type="button" aria-label="Open global search">${ICONS.arrowNE}</button>
          </div>
        </section>

        <section class="surface-card" style="display:flex;flex-direction:column;justify-content:space-between;">
          <div class="card-title-row">
            <span class="card-label">Your progress</span>
            <span class="eyebrow">${overall.done}/${overall.total} topics &bull; ${overall.practicedPapers} PDFs</span>
          </div>
          <div class="progress-hero-row">
            <div class="big-kpi">${overall.pct}%</div>
            <div class="kpi-caption">Of Semester III (6 subjects) completed</div>
          </div>
          <div class="dot-matrix" aria-hidden="true">${renderDotMatrix(overall.pct)}</div>
        </section>

        <section class="surface-card" style="display:flex;flex-direction:column;justify-content:space-between;">
          <div class="card-title-row">
            <span class="card-label">Daily Study Vibe</span>
            <span class="eyebrow">${esc(today)}</span>
          </div>
          <div class="mood-row">
            ${MOODS.map(
              (m) => `
              <button class="mood-btn ${todayMood.mood === m.id ? "active" : ""}" data-action="set-mood" data-mood="${m.id}" type="button" title="${m.label}">
                <span class="mood-face" style="background:${m.bg}">${m.svg}</span>
                <span class="mood-cap">${m.label}</span>
              </button>`
            ).join("")}
          </div>
          <form class="reflection-bar" id="reflection-form">
            <input id="reflection-input" type="text" maxlength="120" placeholder="Today's study target or reflection..." value="${esc(todayMood.reflection || "")}" />
            <button class="reflection-save-btn" type="submit">Save</button>
          </form>
        </section>
      </div>

      <div class="section-header-row">
        <div>
          <span class="eyebrow">Interactive Study Guides</span>
          <h2 class="section-heading">Courses based on <strong>your timetable</strong></h2>
        </div>
        <span class="eyebrow">6 Sem III Subjects &bull; Nov&ndash;Dec 2026</span>
      </div>

      <div class="bento-grid">
        ${subs
          .map((s) => {
            const st = Store.getSubjectStats(s.id);
            const cd = getExamCountdown(s);
            return `
            <a href="${esc(s.href)}" class="bento-card bento-sub-${s.id}">
              <div class="bento-top">
                <span class="bento-code-pill">${esc(s.paperCode)}</span>
                <span class="bento-pct-pill">${st.pct}%</span>
              </div>
              <div>
                <div class="bento-title">${esc(s.name)}</div>
                <div class="bento-meta">${esc(s.examDay)} &bull; ${esc(cd.label)}</div>
              </div>
              ${BENTO_ARTS[s.id] || ""}
              <div class="bento-bottom">
                <div style="flex:1; min-width:0;">
                  <div class="bento-progress-track"><div class="bento-progress-fill" style="width:${st.pct}%"></div></div>
                  <div class="bento-meta" style="margin-top:0">${st.done}/${st.total} topics${s.solvedQbCount ? ` &bull; ${s.solvedQbCount} Solved QB` : ""}</div>
                </div>
                <span class="bento-arrow-circle" aria-hidden="true">${ICONS.arrowNE}</span>
              </div>
            </a>`;
          })
          .join("")}
      </div>

      ${
        solvedQbSubs.length
          ? `
      <div class="section-header-row">
        <div>
          <span class="eyebrow">SPPU Marking-Scheme Answers with Diagrams</span>
          <h2 class="section-heading">Solved <strong>Question Banks</strong></h2>
        </div>
        <button class="btn-secondary" data-action="go-tab" data-tab="pyqs" type="button">All PDFs &amp; QBs &rarr;</button>
      </div>
      <div class="chip-scroll">
        ${solvedQbSubs
          .map(
            (s) => `
          <a class="bookmark-chip" href="${esc(s.solvedQbHref)}">
            ${ICONS.checkCircle}
            <span><strong>${esc(s.short)}</strong> Solved QB (${s.solvedQbCount || "Full"} Qs)</span>
          </a>`
          )
          .join("")}
      </div>`
          : ""
      }

      <div class="section-header-row">
        <div>
          <span class="eyebrow">Quick Access</span>
          <h2 class="section-heading">Shortcuts &amp; <strong>bookmarks</strong></h2>
        </div>
        <button class="btn-secondary" data-action="go-tab" data-tab="subjects" type="button">Checklist &rarr;</button>
      </div>

      <div class="chip-scroll">
        <a class="bookmark-chip" href="${esc(DATA.timetable.syllabusPdf)}" target="_blank" rel="noopener">${ICONS.book}<span>Official NEP 2024 Syllabus PDF</span></a>
        <a class="bookmark-chip" href="${esc(DATA.timetable.sourcePdf)}" target="_blank" rel="noopener">${ICONS.calendar}<span>Winter 2026 Timetable PDF</span></a>
        <button class="bookmark-chip" data-action="open-timer" type="button">${ICONS.clock}<span>25m Focus Timer</span></button>
        ${bookmarks
          .slice(0, 8)
          .map(
            (b) => `
            <a class="bookmark-chip" href="${esc(b.href)}">
              <span>&#9733;</span>
              <span>${esc(b.title)}</span>
            </a>`
          )
          .join("")}
      </div>
    `;
  }

  function renderSubjects() {
    const subs = DATA.subjects;
    const sub = subs.find((s) => s.id === uiState.selectedSubjectId) || subs[0];
    const st = Store.getSubjectStats(sub.id);
    const prefs = Store.getPreferences();
    const noteText = Store.getNote(sub.id);

    return `
      <div class="section-header-row" style="margin-top:4px;">
        <div>
          <span class="eyebrow">Syllabus Tracker &amp; Formulas</span>
          <h1 class="section-heading">Master every <strong>unit &amp; topic</strong></h1>
        </div>
      </div>

      <div class="chip-scroll" style="margin-bottom:14px;">
        ${subs
          .map((s) => {
            const sst = Store.getSubjectStats(s.id);
            return `
            <button class="filter-chip ${s.id === sub.id ? "active" : ""}" data-action="select-subject" data-sub="${s.id}" type="button">
              <span style="width:9px;height:9px;border-radius:50%;background:${s.color};border:1px solid rgba(0,0,0,0.2)"></span>
              ${esc(s.short)} (${sst.pct}%)
            </button>`;
          })
          .join("")}
      </div>

      <section class="subject-hero-banner bento-sub-${sub.id}">
        <div class="bento-top">
          <span class="bento-code-pill">${esc(sub.code)} &bull; ${sub.credits} Credits</span>
          <span class="bento-pct-pill">${st.done}/${st.total} Done (${st.pct}%)</span>
        </div>
        <div>
          <h2 style="font-size:1.3rem;font-weight:800;letter-spacing:-0.02em;">${esc(sub.name)}</h2>
          <p style="font-size:0.84rem;opacity:0.85;margin-top:3px;">${esc(sub.tagline)}</p>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;">
          <span class="bento-code-pill">${esc(sub.examDay)} &bull; ${esc(sub.examTime)} &bull; ${esc(sub.marks[prefs.pattern] || sub.marks.revised)}</span>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${sub.solvedQbHref ? `<a href="${esc(sub.solvedQbHref)}" class="btn-secondary">Solved QB &nearr;</a>` : ""}
            <a href="${esc(sub.href)}#u1-short-notes" class="btn-secondary">1-Page Short Notes</a>
            <a href="${esc(sub.href)}#flashcards" class="btn-secondary">Flashcards (${sub.flashcardCount || 32}+)</a>
            <a href="${esc(sub.href)}" class="btn-primary">Open Study Guide &nearr;</a>
          </div>
        </div>
      </section>

      <div class="two-col-desktop">
        <div>
          ${sub.units
            .map((un, idx) => {
              const isOpen = uiState.openUnits[un.id] !== undefined ? uiState.openUnits[un.id] : idx === 0;
              const uDone = un.topics.filter((t) => Store.getTopicState(sub.id, t.id).done).length;
              const allUnitDone = uDone === un.topics.length && un.topics.length > 0;
              return `
              <div class="unit-accordion ${isOpen ? "open" : ""}">
                <button class="unit-acc-head" data-action="toggle-unit" data-unit="${esc(un.id)}" type="button">
                  <div>
                    <div class="unit-acc-title">${esc(un.title)}</div>
                    <div class="unit-acc-meta">${uDone}/${un.topics.length} topics &bull; ${un.qaCount} solved Q&amp;As</div>
                  </div>
                  <span style="font-size:0.8rem;font-weight:700;color:var(--ink-muted)">${isOpen ? "&#9650;" : "&#9660;"}</span>
                </button>
                <div class="unit-acc-body">
                  <div style="display:flex;justify-content:flex-end;margin-bottom:6px;">
                    <button class="btn-secondary" style="padding:5px 11px;font-size:0.74rem;min-height:30px;" data-action="mark-unit" data-sub="${sub.id}" data-unit="${esc(un.id)}" data-val="${!allUnitDone}" type="button">
                      ${allUnitDone ? "Uncheck Unit" : "Mark Unit Done"}
                    </button>
                  </div>
                  ${un.topics
                    .map((t) => {
                      const ts = Store.getTopicState(sub.id, t.id);
                      const starred = Store.isBookmarked(sub.id, t.id);
                      const confLabel = { unseen: "Unseen", revise: "Revise", good: "Good", mastered: "Mastered" }[ts.confidence || "unseen"];
                      return `
                      <div class="topic-row">
                        <button class="check-btn ${ts.done ? "checked" : ""}" data-action="toggle-topic" data-sub="${sub.id}" data-topic="${esc(t.id)}" type="button" aria-label="Toggle completed">
                          ${ts.done ? "&#10003;" : ""}
                        </button>
                        <a class="topic-link ${ts.done ? "done" : ""}" href="${esc(sub.href)}#${esc(t.anchor)}">${esc(t.title)}</a>
                        <button class="conf-pill conf-${esc(ts.confidence || "unseen")}" data-action="cycle-conf" data-sub="${sub.id}" data-topic="${esc(t.id)}" type="button" title="Cycle confidence">${confLabel}</button>
                        <button class="star-btn ${starred ? "active" : ""}" data-action="toggle-bookmark" data-sub="${sub.id}" data-topic="${esc(t.id)}" data-title="${esc(t.title)}" data-href="${esc(sub.href)}#${esc(t.anchor)}" type="button" aria-label="Bookmark topic">
                          ${starred ? "&#9733;" : "&#9734;"}
                        </button>
                      </div>`;
                    })
                    .join("")}
                </div>
              </div>`;
            })
            .join("")}
        </div>

        <div class="sticky-side-col" style="display:flex;flex-direction:column;gap:14px;">
          <section class="surface-card">
            <div class="card-title-row">
              <span class="card-label">High-Yield Formula Sheet</span>
              <span class="eyebrow">${esc(sub.short)}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:9px;">
              ${(sub.cheatSheet || [])
                .map(
                  (c) => `
                <div class="cheat-card">
                  <div style="font-size:0.83rem;font-weight:700;">${esc(c.label)}</div>
                  <div class="cheat-formula">${esc(c.formula)}</div>
                  <div style="font-size:0.74rem;color:var(--ink-muted);">${esc(c.note)}</div>
                </div>`
                )
                .join("")}
            </div>
          </section>

          <section class="surface-card">
            <div class="card-title-row">
              <span class="card-label">Revision Notes (${esc(sub.short)})</span>
              <span class="eyebrow">Saved locally</span>
            </div>
            <textarea class="notes-area" id="subject-note-box" data-sub="${sub.id}" placeholder="Jot down tricky numericals, viva questions, or reminders for ${esc(sub.name)}...">${esc(noteText)}</textarea>
          </section>
        </div>
      </div>
    `;
  }

  function renderTimetable() {
    const prefs = Store.getPreferences();
    const subs = getVisibleSubjects()
      .slice()
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
    const user = Store.getActiveUser();
    const allDates = Object.keys(user.planTasks || {}).sort();
    const today = Store.todayKey();
    const visibleDates = uiState.planFilter === "all" ? allDates : allDates.filter((d) => d >= today || d >= "2026-11-19");

    return `
      <div class="section-header-row" style="margin-top:4px;">
        <div>
          <span class="eyebrow">${esc(DATA.timetable.circular)}</span>
          <h1 class="section-heading">Official <strong>Exam Timetable</strong> &amp; Plan</h1>
        </div>
        <div class="segmented-toggle">
          <button class="seg-btn ${prefs.pattern === "revised" ? "active" : ""}" data-action="set-pattern" data-pattern="revised" type="button">40:60 Rev</button>
          <button class="seg-btn ${prefs.pattern === "standard" ? "active" : ""}" data-action="set-pattern" data-pattern="standard" type="button">30:70 Std</button>
        </div>
      </div>

      <section class="surface-card" style="margin-bottom:16px;background:var(--hero-bg);">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center;">
          <div>
            <div class="card-label">${esc(DATA.timetable.patterns[prefs.pattern].label)}</div>
            <div style="font-size:0.8rem;color:var(--ink-secondary);margin-top:2px;">${esc(DATA.timetable.patterns[prefs.pattern].desc)}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a class="btn-secondary" href="${esc(DATA.timetable.sourcePdf)}" target="_blank" rel="noopener">Timetable PDF &nearr;</a>
            <a class="btn-secondary" href="${esc(DATA.timetable.syllabusPdf)}" target="_blank" rel="noopener">Syllabus PDF &nearr;</a>
          </div>
        </div>
      </section>

      <div class="two-col-desktop">
        <div>
          <h2 class="card-label" style="margin-bottom:10px;">Examination Schedule</h2>
          ${subs
            .map((s) => {
              const dt = new Date(`${s.examDate}T00:00:00+05:30`);
              const dayNum = dt.getDate();
              const monStr = dt.toLocaleDateString("en-US", { month: "short" });
              const wkStr = dt.toLocaleDateString("en-US", { weekday: "short" });
              const cd = getExamCountdown(s);
              const st = Store.getSubjectStats(s.id);
              return `
              <div class="exam-row-card">
                <div style="display:flex;align-items:center;gap:14px;min-width:0;">
                  <div class="exam-date-badge bento-sub-${s.id}">
                    <span class="day">${dayNum}</span>
                    <span class="mon">${monStr}</span>
                  </div>
                  <div style="min-width:0;">
                    <div style="font-size:0.95rem;font-weight:700;">${esc(s.name)}</div>
                    <div style="font-size:0.78rem;color:var(--ink-muted);">${wkStr} &bull; ${esc(s.examTime)} &bull; <span style="font-family:'JetBrains Mono',monospace">${esc(s.paperCode)}</span></div>
                    <div style="font-size:0.75rem;color:var(--ink-secondary);margin-top:3px;">${esc(s.marks[prefs.pattern])} &bull; Syllabus ${st.pct}% (${st.done}/${st.total})</div>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
                  <span class="bento-code-pill" style="background:var(--surface-soft);border:1px solid var(--border);">${esc(cd.label)}</span>
                  <a href="${esc(s.href)}" style="font-size:0.78rem;font-weight:700;text-decoration:underline;">Revise &rarr;</a>
                </div>
              </div>`;
            })
            .join("")}

          <section class="surface-card" style="margin-top:14px;">
            <div class="card-title-row">
              <span class="card-label">SPPU Exam Hall Instructions</span>
              <span class="eyebrow">Circular 782</span>
            </div>
            <ul style="padding-left:18px;font-size:0.83rem;color:var(--ink-secondary);display:flex;flex-direction:column;gap:6px;">
              ${DATA.timetable.rules.map((r) => `<li>${esc(r)}</li>`).join("")}
            </ul>
          </section>

          <section class="surface-card" style="margin-top:14px;">
            <div class="card-title-row">
              <span class="card-label">SPPU 6-Subject Exam Strategy</span>
              <span class="eyebrow">Nov 25 &rarr; Dec 7</span>
            </div>
            <ul style="padding-left:18px;font-size:0.83rem;color:var(--ink-secondary);display:flex;flex-direction:column;gap:6px;">
              <li><strong>Exam Order:</strong> DS (Nov 25) &rarr; OOP &amp; CG (Nov 27, 1 gap day) &rarr; OS (Nov 30, 2 gap days) &rarr; DELD (Dec 2, 1 gap day) &rarr; UHV (Dec 4, 1 gap day) &rarr; Digital Marketing (Dec 7, 2 gap days).</li>
              <li><strong>Gap-Day Allocation:</strong> Finish heavy DS units (Hashing, MSTs, BSTs) by Nov 24 so you only need evening + 1-day sprints for OOP &amp; CG on Nov 26; use the 2 gap days before OS (Nov 28&ndash;29) to drill Scheduling Gantt charts, Banker's safety traces, TLB EMAT &amp; Page Replacement numericals.</li>
              <li><strong>Hall Time Budget:</strong> For 60M/70M papers (2.5 hrs, 5 questions), spend <strong>25 mins/question</strong> + 15 mins final review &amp; diagram labeling. For 30M/35M papers (2 hrs: UHV &amp; Digital Marketing), spend <strong>22 mins/question</strong>.</li>
              <li><strong>Full-Marks Answer Formula:</strong> Definition (1M) + Labelled Diagram / Schematic / Waveform (2M) + Step-by-Step Working / Truth Table / Numerical (3&ndash;4M).</li>
            </ul>
          </section>
        </div>

        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;flex-wrap:wrap;">
            <h2 class="card-label">Day-by-Day Revision Roadmap</h2>
            <button class="btn-secondary" style="padding:5px 11px;font-size:0.74rem;min-height:30px;" data-action="reset-plan" type="button">Reset Plan</button>
          </div>

          <form id="add-plan-form" class="surface-card" style="padding:12px 14px;margin-bottom:12px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;gap:8px;">
              <input id="plan-date-in" type="date" class="input-pill" style="flex:1;padding:7px 12px;font-size:0.8rem;" value="2026-11-19" min="2026-11-19" max="2026-12-07" />
              <select id="plan-sub-in" class="input-pill" style="flex:1;padding:7px 12px;font-size:0.8rem;">
                ${DATA.subjects.map((s) => `<option value="${s.id}">${esc(s.short)}</option>`).join("")}
              </select>
            </div>
            <div style="display:flex;gap:8px;">
              <input id="plan-text-in" type="text" class="input-pill" style="flex:1;padding:8px 14px;font-size:0.82rem;" placeholder="Add custom study target..." />
              <button class="btn-primary" type="submit" style="padding:8px 14px;min-height:36px;">Add</button>
            </div>
          </form>

          ${visibleDates
            .map((dateKey) => {
              const tasks = Store.getPlanTasks(dateKey);
              if (!tasks.length) return "";
              const doneCnt = tasks.filter((t) => t.done).length;
              return `
              <div class="day-plan-card">
                <div class="card-title-row" style="margin-bottom:8px;">
                  <span style="font-size:0.85rem;font-weight:800;">${esc(formatDateHeading(dateKey))}</span>
                  <span class="eyebrow">${doneCnt}/${tasks.length} done</span>
                </div>
                ${tasks
                  .map((t) => {
                    const tSub = DATA.subjects.find((s) => s.id === t.subId);
                    return `
                    <div class="topic-row" style="padding:7px 2px;">
                      <button class="check-btn ${t.done ? "checked" : ""}" data-action="toggle-plan" data-date="${dateKey}" data-id="${esc(t.id)}" type="button" aria-label="Toggle task">
                        ${t.done ? "&#10003;" : ""}
                      </button>
                      <span class="bento-code-pill ${tSub ? `bento-sub-${tSub.id}` : ""}" style="flex-shrink:0;">${tSub ? esc(tSub.short) : "All"}</span>
                      <span class="topic-link ${t.done ? "done" : ""}" style="font-size:0.82rem;">${esc(t.text)}</span>
                      <button class="star-btn" style="font-size:0.85rem;" data-action="delete-plan" data-date="${dateKey}" data-id="${esc(t.id)}" type="button" title="Remove task">&times;</button>
                    </div>`;
                  })
                  .join("")}
              </div>`;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderPYQs() {
    const q = uiState.pyqQuery.trim().toLowerCase();
    const solvedQbSubs = DATA.subjects.filter((s) => {
      if (!s.solvedQbHref) return false;
      if (uiState.pyqSubject !== "all" && s.id !== uiState.pyqSubject) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.short.toLowerCase().includes(q) && !"solved question bank".includes(q)) return false;
      return true;
    });

    const filteredBySubAndQ = DATA.pdfs.filter((p) => {
      if (uiState.pyqSubject !== "all" && p.subject !== uiState.pyqSubject) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
      return true;
    });

    // Count per section before section filter
    const sectionCounts = {};
    PDF_SECTIONS.forEach((sec) => { sectionCounts[sec.id] = 0; });
    filteredBySubAndQ.forEach((p) => {
      const sid = getPdfSectionId(p);
      sectionCounts[sid] = (sectionCounts[sid] || 0) + 1;
    });

    const visibleSections = PDF_SECTIONS.filter((sec) => {
      if (uiState.pyqSection !== "all" && sec.id !== uiState.pyqSection) return false;
      return (sectionCounts[sec.id] || 0) > 0;
    });

    const practicedTotal = DATA.pdfs.filter((p) => Store.isPaperDone(p.href)).length;

    return `
      <div class="section-header-row" style="margin-top:4px;">
        <div>
          <span class="eyebrow">Organized PDF Library &amp; Solved Question Banks</span>
          <h1 class="section-heading">PDF Vault &amp; <strong>Solved QBs</strong> (${DATA.pdfs.length} PDFs)</h1>
        </div>
        <span class="countdown-pill">${practicedTotal}/${DATA.pdfs.length} Practiced</span>
      </div>

      ${
        solvedQbSubs.length && (uiState.pyqSection === "all" || uiState.pyqSection === "qbanks" || uiState.pyqSection === "solved")
          ? `
      <div class="pdf-section-card" style="margin-bottom:16px;">
        <div class="pdf-sec-head" style="cursor:default;">
          <div class="pdf-sec-title-wrap">
            <span class="pdf-sec-icon">${ICONS.checkCircle}</span>
            <div>
              <div style="font-size:0.95rem;font-weight:800;">Solved Question Banks (SPPU Full-Marks Format + Diagrams)</div>
              <div class="eyebrow">Step-by-step mark splits, inline SVG diagrams &amp; practice blur mode</div>
            </div>
          </div>
          <span class="bento-code-pill" style="background:var(--surface);border:1px solid var(--border);">${solvedQbSubs.length} Guides</span>
        </div>
        <div class="pdf-sec-body">
          ${solvedQbSubs
            .map(
              (s) => `
            <div class="pdf-card">
              <div style="min-width:0;">
                <div style="font-size:0.88rem;font-weight:700;">${esc(s.name)} — Solved QB</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;align-items:center;">
                  <span class="bento-code-pill bento-sub-${s.id}">${esc(s.short)}</span>
                  <span class="eyebrow">${s.solvedQbCount || "Full"} SPPU exam solutions &amp; SVGs</span>
                </div>
              </div>
              <a class="pdf-open-btn" href="${esc(s.solvedQbHref)}">Open Solved QB &nearr;</a>
            </div>`
            )
            .join("")}
        </div>
      </div>`
          : ""
      }

      <div class="surface-card" style="margin-bottom:14px;padding:14px 16px;">
        <input id="pyq-search-input" class="input-pill" type="search" placeholder="Search PDFs by subject, Oct 2025, PVG, SKN, Solved, Viva, Assignment..." value="${esc(uiState.pyqQuery)}" />

        <div class="chip-scroll" style="margin-top:10px;">
          <button class="filter-chip ${uiState.pyqSubject === "all" ? "active" : ""}" data-action="pyq-sub" data-sub="all" type="button">All Subjects</button>
          ${DATA.subjects
            .map(
              (s) => `<button class="filter-chip ${uiState.pyqSubject === s.id ? "active" : ""}" data-action="pyq-sub" data-sub="${s.id}" type="button">${esc(s.short)}</button>`
            )
            .join("")}
          <button class="filter-chip ${uiState.pyqSubject === "general" ? "active" : ""}" data-action="pyq-sub" data-sub="general" type="button">Syllabus &amp; Timetable</button>
        </div>

        <div class="chip-scroll" style="margin-top:8px;">
          <button class="filter-chip ${uiState.pyqSection === "all" ? "active" : ""}" data-action="pyq-sec" data-sec="all" type="button">
            All Types (${filteredBySubAndQ.length})
          </button>
          ${PDF_SECTIONS.map(
            (sec) => `
            <button class="filter-chip ${uiState.pyqSection === sec.id ? "active" : ""}" data-action="pyq-sec" data-sec="${sec.id}" type="button">
              ${esc(sec.title.split("(")[0].trim())} (${sectionCounts[sec.id] || 0})
            </button>`
          ).join("")}
        </div>
      </div>

      ${
        visibleSections.length
          ? visibleSections
              .map((sec) => {
                const items = filteredBySubAndQ.filter((p) => getPdfSectionId(p) === sec.id);
                const doneCnt = items.filter((p) => Store.isPaperDone(p.href)).length;
                const collapsed = Boolean(uiState.collapsedPdfSecs[sec.id]);
                return `
                <div class="pdf-section-card ${collapsed ? "collapsed" : ""}">
                  <button class="pdf-sec-head" data-action="toggle-pdf-sec" data-sec="${sec.id}" type="button">
                    <div class="pdf-sec-title-wrap">
                      <span class="pdf-sec-icon">${ICONS[sec.icon] || ICONS.fileText}</span>
                      <div>
                        <div style="font-size:0.94rem;font-weight:800;">${esc(sec.title)}</div>
                        <div class="eyebrow">${esc(sec.sub)}</div>
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                      <span class="bento-code-pill" style="background:var(--surface);border:1px solid var(--border);">${doneCnt}/${items.length}</span>
                      <span style="font-size:0.78rem;color:var(--ink-muted);">${collapsed ? "&#9660;" : "&#9650;"}</span>
                    </div>
                  </button>
                  <div class="pdf-sec-body">
                    ${items
                      .map((p) => {
                        const done = Store.isPaperDone(p.href);
                        const subObj = DATA.subjects.find((s) => s.id === p.subject);
                        return `
                        <div class="pdf-card">
                          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                            <button class="check-btn ${done ? "checked" : ""}" data-action="toggle-paper" data-href="${esc(p.href)}" type="button" title="Mark practiced">
                              ${done ? "&#10003;" : ""}
                            </button>
                            <div style="min-width:0;">
                              <div style="font-size:0.85rem;font-weight:700;word-break:break-word;${done ? "text-decoration:line-through;color:var(--ink-muted);" : ""}">${esc(p.title)}</div>
                              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:3px;align-items:center;">
                                <span class="bento-code-pill ${subObj ? `bento-sub-${subObj.id}` : ""}">${subObj ? esc(subObj.short) : "Official"}</span>
                                <span class="eyebrow">${esc(p.pattern)} &bull; ${p.sizeKB} KB</span>
                              </div>
                            </div>
                          </div>
                          <a class="pdf-open-btn" href="${esc(p.href)}" target="_blank" rel="noopener">Open &nearr;</a>
                        </div>`;
                      })
                      .join("")}
                  </div>
                </div>`;
              })
              .join("")
          : `<div class="surface-card" style="text-align:center;padding:28px;"><p class="eyebrow">No PDFs match your filter. Try clearing the search box.</p></div>`
      }
    `;
  }

  function renderBubbleClusterSVG(subs) {
    const layout = [
      { cx: 100, cy: 104, baseR: 48 },
      { cx: 200, cy: 104, baseR: 46 },
      { cx: 150, cy: 174, baseR: 43 },
      { cx: 68,  cy: 170, baseR: 34 },
      { cx: 232, cy: 170, baseR: 34 },
      { cx: 150, cy: 48,  baseR: 35 },
    ];
    const circles = subs.slice(0, 6).map((s, idx) => {
      const st = Store.getSubjectStats(s.id);
      const pos = layout[idx];
      const r = Math.round(pos.baseR * (0.78 + (st.pct / 100) * 0.28));
      return `
        <g style="cursor:pointer" data-action="select-sub-jump" data-sub="${s.id}">
          <circle cx="${pos.cx}" cy="${pos.cy}" r="${r}" fill="${s.color}" stroke="#FFFFFF" stroke-width="2.5" opacity="0.96"/>
          <text x="${pos.cx}" y="${pos.cy - 3}" text-anchor="middle" font-size="11" font-weight="700" fill="${s.ink}">${esc(s.short)}</text>
          <text x="${pos.cx}" y="${pos.cy + 12}" text-anchor="middle" font-size="11" font-weight="500" fill="${s.ink}">${st.pct}%</text>
        </g>`;
    });
    return `<svg viewBox="0 0 300 232" width="100%" style="max-width:340px;height:auto;">${circles.join("")}</svg>`;
  }

  function renderInsights() {
    const subs = getVisibleSubjects();
    const overall = Store.getOverallStats();
    const user = Store.getActiveUser();
    const users = Store.getUsers();
    const recentMoods = Store.getRecentMoods(5);
    const barData = Store.getWeeklyStudyData(uiState.chartRange);
    const maxMins = Math.max(30, ...barData.map((d) => d.minutes));
    const barPalette = ["#798CE8", "#CFA829", "#5CA08B", "#DA7F68", "#689CD8", "#839A62", "#9D8471"];

    return `
      <div class="section-header-row" style="margin-top:4px;">
        <div>
          <span class="eyebrow">Personal Analytics &amp; Multi-User Profiles</span>
          <h1 class="section-heading">Based on your <strong>daily study</strong></h1>
        </div>
      </div>

      <div class="two-col-desktop">
        <section class="surface-card">
          <div class="card-title-row">
            <span class="card-label">Subject Readiness Map</span>
            <span class="eyebrow">Tap a bubble to open</span>
          </div>
          <div class="bubble-svg-wrap">${renderBubbleClusterSVG(subs)}</div>
          <div style="display:flex;justify-content:space-around;text-align:center;border-top:1px solid var(--border);padding-top:12px;margin-top:6px;">
            <div><div style="font-size:1.3rem;font-weight:700;">${overall.pct}%</div><div class="eyebrow">Syllabus</div></div>
            <div><div style="font-size:1.3rem;font-weight:700;">${overall.practicedPapers}</div><div class="eyebrow">PDFs Solved</div></div>
            <div><div style="font-size:1.3rem;font-weight:700;">${Math.round(overall.totalMinutes / 60 * 10) / 10}h</div><div class="eyebrow">Focused</div></div>
          </div>
        </section>

        <section class="surface-card">
          <div class="card-title-row">
            <div>
              <span class="card-label">Study Consistency</span>
              <div class="eyebrow">${overall.totalMinutes} mins logged across ${overall.activeDays} day(s)</div>
            </div>
            <div class="segmented-toggle">
              ${["W", "M", "All"]
                .map(
                  (r) => `<button class="seg-btn ${uiState.chartRange === r ? "active" : ""}" data-action="chart-range" data-range="${r}" type="button">${r}</button>`
                )
                .join("")}
            </div>
          </div>
          <div class="capsule-chart" style="grid-template-columns:repeat(${barData.length}, 1fr);">
            ${barData
              .map((d, idx) => {
                const hPct = d.minutes > 0 ? Math.max(18, Math.round((d.minutes / maxMins) * 100)) : 10;
                const bg = d.minutes > 0 ? barPalette[idx % barPalette.length] : "var(--border)";
                return `
                <div class="capsule-col" title="${d.date}: ${d.minutes} min">
                  <div class="capsule-track">
                    <div class="capsule-fill" style="height:${hPct}%;background:${bg};"></div>
                  </div>
                  <span class="capsule-lbl">${barData.length <= 7 ? esc(d.shortDay) : d.dayNum}</span>
                </div>`;
              })
              .join("")}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            <button class="btn-secondary" data-action="quick-log" data-mins="25" type="button">+25m Log</button>
            <button class="btn-secondary" data-action="quick-log" data-mins="50" type="button">+50m Log</button>
            <button class="btn-primary" data-action="open-timer" type="button">Open Focus Timer</button>
          </div>
        </section>
      </div>

      <div class="two-col-desktop" style="margin-top:14px;">
        <section class="surface-card">
          <div class="card-title-row">
            <span class="card-label">Subject Mastery Breakdown</span>
            <span class="eyebrow">Topics &amp; PDFs</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${subs
              .map((s) => {
                const st = Store.getSubjectStats(s.id);
                return `
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:0.83rem;font-weight:700;margin-bottom:4px;">
                    <span>${esc(s.name)}</span>
                    <span>${st.done}/${st.total} (${st.pct}%)</span>
                  </div>
                  <div class="bento-progress-track" style="height:7px;background:var(--surface-soft);border:1px solid var(--border);">
                    <div class="bento-progress-fill" style="width:${st.pct}%;background:${s.accent};"></div>
                  </div>
                  <div class="eyebrow">${st.mastered} mastered &bull; ${st.practicedPapers}/${st.totalPapers} PDFs &bull; ${st.minutes}m logged</div>
                </div>`;
              })
              .join("")}
          </div>
        </section>

        <section class="surface-card">
          <div class="card-title-row">
            <span class="card-label">Local User Profiles &amp; Backup</span>
            <span class="eyebrow">${users.length} profile(s)</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
            ${users
              .map((u) => {
                const isAct = u.id === user.id;
                return `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:16px;border:1px solid ${isAct ? "var(--ink)" : "var(--border)"};background:${isAct ? "var(--hero-bg)" : "var(--surface-soft)"};">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span class="user-avatar-dot" style="background:${u.avatarColor};">${esc(u.name.charAt(0).toUpperCase())}</span>
                    <div>
                      <div style="font-size:0.88rem;font-weight:700;">${esc(u.name)} ${isAct ? "&#10003;" : ""}</div>
                      <div class="eyebrow">${Object.keys(u.topics || {}).length} active subjects</div>
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;">
                    ${!isAct ? `<button class="btn-primary" style="padding:6px 12px;min-height:32px;font-size:0.75rem;" data-action="switch-user" data-uid="${u.id}" type="button">Switch</button>` : ""}
                    ${users.length > 1 ? `<button class="btn-secondary" style="padding:6px 10px;min-height:32px;font-size:0.75rem;" data-action="delete-user" data-uid="${u.id}" type="button">&times;</button>` : ""}
                  </div>
                </div>`;
              })
              .join("")}
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
            <button class="btn-primary" data-action="open-users" type="button">+ Manage Profiles</button>
            <button class="btn-secondary" data-action="export-json" type="button">Export JSON</button>
            <label class="btn-secondary" style="cursor:pointer;">
              Import JSON
              <input id="import-json-input" type="file" accept=".json,application/json" style="display:none;" />
            </label>
            <button class="btn-secondary" data-action="reset-user" type="button">Reset Active</button>
          </div>

          <div class="card-title-row" style="margin-top:8px;margin-bottom:8px;">
            <span class="card-label">Recent Reflections</span>
          </div>
          ${
            recentMoods.length
              ? recentMoods
                  .map((m) => {
                    const moodObj = MOODS.find((x) => x.id === m.mood);
                    return `<div style="font-size:0.8rem;padding:6px 0;border-bottom:1px solid var(--border);">
                      <strong>${esc(m.date)}</strong> &middot; ${moodObj ? moodObj.label : "Check-in"}${m.reflection ? `: "${esc(m.reflection)}"` : ""}
                    </div>`;
                  })
                  .join("")
              : `<p class="eyebrow">Log your daily study mood on Home to see reflections here.</p>`
          }
        </section>
      </div>
    `;
  }

  function renderMain() {
    const theme = Store.applyTheme();
    const view = document.getElementById("app-main");
    if (!view) return;
    if (uiState.tab === "home") view.innerHTML = renderHome();
    else if (uiState.tab === "subjects") view.innerHTML = renderSubjects();
    else if (uiState.tab === "timetable") view.innerHTML = renderTimetable();
    else if (uiState.tab === "pyqs") view.innerHTML = renderPYQs();
    else if (uiState.tab === "insights") view.innerHTML = renderInsights();

    const user = Store.getActiveUser();
    const avatarEl = document.getElementById("topbar-avatar");
    const nameEl = document.getElementById("topbar-username");
    if (avatarEl && nameEl && user) {
      avatarEl.style.background = user.avatarColor;
      avatarEl.textContent = user.name.charAt(0).toUpperCase();
      nameEl.textContent = user.name;
    }

    const tIcon = document.getElementById("topbar-theme-icon");
    const tLabel = document.getElementById("topbar-theme-label");
    if (tIcon) tIcon.innerHTML = theme === "warm" ? ICONS.warm : theme === "dark" ? ICONS.moon : ICONS.sun;
    if (tLabel) tLabel.textContent = THEME_LABELS[theme] || "Light";

    document.querySelectorAll(".nav-tab, .desktop-nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === uiState.tab);
    });
  }

  function openUsersModal() {
    const modal = document.getElementById("users-modal");
    const body = document.getElementById("users-modal-body");
    const user = Store.getActiveUser();
    const users = Store.getUsers();
    body.innerHTML = `
      <p class="eyebrow" style="margin-bottom:12px;">Each profile saves its own syllabus progress, theme preference, bookmarks, mood reflections, focus timer logs, and practiced PDFs locally.</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        ${users
          .map(
            (u) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:16px;border:1px solid ${u.id === user.id ? "var(--ink)" : "var(--border)"};background:${u.id === user.id ? "var(--hero-bg)" : "var(--surface-soft)"};">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;">
              <span class="user-avatar-dot" style="background:${u.avatarColor};">${esc(u.name.charAt(0).toUpperCase())}</span>
              <span style="font-weight:700;font-size:0.9rem;">${esc(u.name)}</span>
            </div>
            <div style="display:flex;gap:6px;">
              ${u.id !== user.id ? `<button class="btn-primary" style="padding:6px 12px;min-height:32px;font-size:0.75rem;" data-action="switch-user" data-uid="${u.id}" type="button">Switch</button>` : `<span class="bento-code-pill" style="background:var(--surface);border:1px solid var(--border);">Active</span>`}
              <button class="btn-secondary" style="padding:6px 10px;min-height:32px;font-size:0.75rem;" data-action="rename-user" data-uid="${u.id}" type="button">Rename</button>
              ${users.length > 1 ? `<button class="btn-secondary" style="padding:6px 10px;min-height:32px;font-size:0.75rem;" data-action="delete-user" data-uid="${u.id}" type="button">&times;</button>` : ""}
            </div>
          </div>`
          )
          .join("")}
      </div>
      <form id="create-user-form" style="display:flex;gap:8px;">
        <input id="new-user-name" class="input-pill" type="text" maxlength="32" placeholder="Add new student profile (e.g. Arsh)..." required />
        <button class="btn-primary" type="submit">Create</button>
      </form>
    `;
    modal.classList.add("open");
  }

  function openSearchModal(initialQ) {
    const modal = document.getElementById("search-modal");
    const input = document.getElementById("global-search-input");
    modal.classList.add("open");
    if (typeof initialQ === "string") uiState.searchQuery = initialQ;
    input.value = uiState.searchQuery;
    renderSearchResults();
    setTimeout(() => input.focus(), 40);
  }

  function renderSearchResults() {
    const container = document.getElementById("global-search-results");
    const q = uiState.searchQuery.trim().toLowerCase();
    if (!q) {
      container.innerHTML = `<p class="eyebrow" style="padding:12px 4px;">Type a keyword like <em>Bresenham</em>, <em>Banker</em>, <em>K-Map</em>, <em>Huffman</em>, <em>ROAS</em>, or <em>Oct 2025</em>.</p>`;
      return;
    }

    const topicHits = [];
    DATA.subjects.forEach((s) => {
      s.units.forEach((un) => {
        un.topics.forEach((t) => {
          if (t.title.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) {
            topicHits.push({ sub: s, topic: t, unit: un });
          }
        });
      });
    });

    const formulaHits = [];
    DATA.subjects.forEach((s) => {
      (s.cheatSheet || []).forEach((c) => {
        if (c.label.toLowerCase().includes(q) || c.formula.toLowerCase().includes(q) || c.note.toLowerCase().includes(q)) {
          formulaHits.push({ sub: s, cheat: c });
        }
      });
    });

    const pdfHits = DATA.pdfs.filter((p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));

    let html = "";
    if (topicHits.length) {
      html += `<div class="eyebrow" style="margin:8px 0 6px;">Syllabus Topics (${topicHits.length})</div>`;
      html += topicHits
        .slice(0, 10)
        .map(
          (h) => `
        <a class="pdf-card" style="padding:10px 12px;margin-bottom:6px;" href="${esc(h.sub.href)}#${esc(h.topic.anchor)}">
          <div>
            <div style="font-size:0.86rem;font-weight:700;">${esc(h.topic.title)}</div>
            <div class="eyebrow">${esc(h.sub.short)} &bull; ${esc(h.unit.title)}</div>
          </div>
          <span class="bento-code-pill bento-sub-${h.sub.id}">Open &nearr;</span>
        </a>`
        )
        .join("");
    }
    if (formulaHits.length) {
      html += `<div class="eyebrow" style="margin:12px 0 6px;">Quick Formulas (${formulaHits.length})</div>`;
      html += formulaHits
        .slice(0, 6)
        .map(
          (h) => `
        <div class="cheat-card" style="margin-bottom:6px;">
          <div style="font-size:0.8rem;font-weight:700;">${esc(h.sub.short)}: ${esc(h.cheat.label)}</div>
          <div class="cheat-formula">${esc(h.cheat.formula)}</div>
        </div>`
        )
        .join("");
    }
    if (pdfHits.length) {
      html += `<div class="eyebrow" style="margin:12px 0 6px;">PDFs &amp; Question Banks (${pdfHits.length})</div>`;
      html += pdfHits
        .slice(0, 8)
        .map(
          (p) => `
        <a class="pdf-card" style="padding:10px 12px;margin-bottom:6px;" href="${esc(p.href)}" target="_blank" rel="noopener">
          <div style="min-width:0;">
            <div style="font-size:0.84rem;font-weight:700;">${esc(p.title)}</div>
            <div class="eyebrow">${esc(p.category)} &bull; ${p.sizeKB} KB</div>
          </div>
          <span class="pdf-open-btn">PDF &nearr;</span>
        </a>`
        )
        .join("");
    }
    if (!html) {
      html = `<p class="eyebrow" style="padding:16px 4px;">No matches found for "${esc(q)}".</p>`;
    }
    container.innerHTML = html;
  }

  function renderTimerUI() {
    const disp = document.getElementById("timer-display");
    const toggleBtn = document.getElementById("timer-start-btn");
    const subSel = document.getElementById("timer-subject-sel");
    if (!disp) return;
    const m = String(Math.floor(timerState.leftSecs / 60)).padStart(2, "0");
    const s = String(timerState.leftSecs % 60).padStart(2, "0");
    disp.textContent = `${m}:${s}`;
    if (toggleBtn) toggleBtn.textContent = timerState.running ? "Pause" : "Start";
    if (subSel && subSel.value !== timerState.subId) subSel.value = timerState.subId;
  }

  function toggleTimerRun() {
    if (timerState.running) {
      clearInterval(timerState.intervalId);
      timerState.running = false;
      renderTimerUI();
      return;
    }
    timerState.running = true;
    timerState.intervalId = setInterval(() => {
      timerState.leftSecs -= 1;
      if (timerState.leftSecs <= 0) {
        clearInterval(timerState.intervalId);
        timerState.running = false;
        const mins = Math.round(timerState.totalSecs / 60);
        Store.logStudyMinutes(mins, timerState.subId);
        showToast(`Logged ${mins}m study session`);
        timerState.leftSecs = timerState.totalSecs;
      }
      renderTimerUI();
    }, 1000);
    renderTimerUI();
  }

  function openTimerModal() {
    const modal = document.getElementById("timer-modal");
    const sel = document.getElementById("timer-subject-sel");
    if (sel && !sel.options.length) {
      sel.innerHTML = DATA.subjects.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    }
    modal.classList.add("open");
    renderTimerUI();
  }

  function setTab(tabName) {
    uiState.tab = tabName;
    if (history.replaceState) {
      history.replaceState(null, "", `#${tabName}`);
    }
    renderMain();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) {
      if (e.target.classList.contains("modal-backdrop")) {
        e.target.classList.remove("open");
      }
      return;
    }

    const act = target.dataset.action;
    if (act === "go-tab") {
      setTab(target.dataset.tab);
    } else if (act === "cycle-theme") {
      const next = Store.cycleTheme();
      showToast(`Theme: ${THEME_LABELS[next] || next}`);
    } else if (act === "open-users") {
      openUsersModal();
    } else if (act === "open-search") {
      openSearchModal();
    } else if (act === "open-timer") {
      openTimerModal();
    } else if (act === "close-modal") {
      const m = target.closest(".modal-backdrop");
      if (m) m.classList.remove("open");
    } else if (act === "set-mood") {
      const today = Store.todayKey();
      const inputEl = document.getElementById("reflection-input");
      Store.setMood(today, target.dataset.mood, inputEl ? inputEl.value : undefined);
      showToast("Daily study vibe saved");
    } else if (act === "select-subject") {
      uiState.selectedSubjectId = target.dataset.sub;
      renderMain();
    } else if (act === "select-sub-jump") {
      uiState.selectedSubjectId = target.dataset.sub;
      setTab("subjects");
    } else if (act === "toggle-unit") {
      const uid = target.dataset.unit;
      const parent = target.closest(".unit-accordion");
      const currentlyOpen = parent ? parent.classList.contains("open") : Boolean(uiState.openUnits[uid]);
      uiState.openUnits[uid] = !currentlyOpen;
      renderMain();
    } else if (act === "mark-unit") {
      Store.markUnitDone(target.dataset.sub, target.dataset.unit, target.dataset.val === "true");
    } else if (act === "toggle-topic") {
      Store.toggleTopicDone(target.dataset.sub, target.dataset.topic);
    } else if (act === "cycle-conf") {
      Store.cycleTopicConfidence(target.dataset.sub, target.dataset.topic);
    } else if (act === "toggle-bookmark") {
      const added = Store.toggleBookmark({
        subId: target.dataset.sub,
        topicId: target.dataset.topic,
        title: target.dataset.title,
        href: target.dataset.href,
      });
      showToast(added ? "Pinned to bookmarks" : "Removed bookmark");
    } else if (act === "set-pattern") {
      Store.updatePreferences({ pattern: target.dataset.pattern });
      showToast(`Switched to ${target.dataset.pattern === "revised" ? "40:60 Revised" : "30:70 Standard"}`);
    } else if (act === "toggle-plan") {
      Store.togglePlanTask(target.dataset.date, target.dataset.id);
    } else if (act === "delete-plan") {
      Store.deletePlanTask(target.dataset.date, target.dataset.id);
    } else if (act === "reset-plan") {
      Store.resetDefaultPlan();
      showToast("Default revision roadmap restored");
    } else if (act === "pyq-sub") {
      uiState.pyqSubject = target.dataset.sub;
      renderMain();
    } else if (act === "pyq-sec") {
      uiState.pyqSection = target.dataset.sec;
      renderMain();
    } else if (act === "toggle-pdf-sec") {
      const sid = target.dataset.sec;
      uiState.collapsedPdfSecs[sid] = !uiState.collapsedPdfSecs[sid];
      renderMain();
    } else if (act === "toggle-paper") {
      Store.togglePaperDone(target.dataset.href);
    } else if (act === "chart-range") {
      uiState.chartRange = target.dataset.range;
      renderMain();
    } else if (act === "quick-log") {
      const mins = Number(target.dataset.mins || 25);
      Store.logStudyMinutes(mins, uiState.selectedSubjectId);
      showToast(`+${mins}m study time logged`);
    } else if (act === "switch-user") {
      Store.switchUser(target.dataset.uid);
      const modal = document.getElementById("users-modal");
      if (modal && modal.classList.contains("open")) openUsersModal();
      showToast(`Switched to ${Store.getActiveUser().name}`);
    } else if (act === "rename-user") {
      const uid = target.dataset.uid;
      const cur = Store.getUsers().find((u) => u.id === uid);
      const next = window.prompt("Rename profile:", cur ? cur.name : "");
      if (next && next.trim()) {
        Store.renameUser(uid, next.trim());
        openUsersModal();
        showToast("Profile renamed");
      }
    } else if (act === "delete-user") {
      const uid = target.dataset.uid;
      const cur = Store.getUsers().find((u) => u.id === uid);
      if (window.confirm(`Delete profile "${cur ? cur.name : ""}" and its local progress?`)) {
        Store.deleteUser(uid);
        if (document.getElementById("users-modal").classList.contains("open")) openUsersModal();
        showToast("Profile deleted");
      }
    } else if (act === "export-json") {
      const blob = new Blob([Store.exportAllJSON()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sppu-exam-studio-backup-${Store.todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Backup JSON downloaded");
    } else if (act === "reset-user") {
      if (window.confirm(`Reset all local progress for ${Store.getActiveUser().name}?`)) {
        Store.resetActiveUserProgress();
        showToast("Progress reset");
      }
    } else if (act === "timer-preset") {
      clearInterval(timerState.intervalId);
      timerState.running = false;
      const mins = Number(target.dataset.mins || 25);
      timerState.totalSecs = mins * 60;
      timerState.leftSecs = mins * 60;
      renderTimerUI();
    } else if (act === "timer-toggle") {
      toggleTimerRun();
    } else if (act === "timer-reset") {
      clearInterval(timerState.intervalId);
      timerState.running = false;
      timerState.leftSecs = timerState.totalSecs;
      renderTimerUI();
    } else if (act === "timer-log-now") {
      const mins = Math.max(5, Math.round((timerState.totalSecs - timerState.leftSecs) / 60) || 15);
      Store.logStudyMinutes(mins, timerState.subId);
      showToast(`Logged ${mins}m for ${timerState.subId.toUpperCase()}`);
    }
  });

  document.addEventListener("submit", (e) => {
    if (e.target.id === "reflection-form") {
      e.preventDefault();
      const val = document.getElementById("reflection-input").value.trim();
      const cur = Store.getMood(Store.todayKey());
      Store.setMood(Store.todayKey(), (cur && cur.mood) || "calm", val);
      showToast("Reflection saved");
    } else if (e.target.id === "create-user-form") {
      e.preventDefault();
      const input = document.getElementById("new-user-name");
      const created = Store.createUser(input.value);
      if (created) {
        input.value = "";
        openUsersModal();
        showToast(`Created profile ${created.name}`);
      }
    } else if (e.target.id === "add-plan-form") {
      e.preventDefault();
      const d = document.getElementById("plan-date-in").value;
      const s = document.getElementById("plan-sub-in").value;
      const t = document.getElementById("plan-text-in").value;
      if (t.trim()) {
        Store.addPlanTask(d, t, s);
        showToast("Task added to roadmap");
      }
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "pyq-search-input") {
      const pos = e.target.selectionStart;
      uiState.pyqQuery = e.target.value;
      renderMain();
      const fresh = document.getElementById("pyq-search-input");
      if (fresh) {
        fresh.focus();
        fresh.setSelectionRange(pos, pos);
      }
    } else if (e.target.id === "global-search-input") {
      uiState.searchQuery = e.target.value;
      renderSearchResults();
    } else if (e.target.id === "subject-note-box") {
      Store.setNote(e.target.dataset.sub, e.target.value);
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "timer-subject-sel") {
      timerState.subId = e.target.value;
    } else if (e.target.id === "import-json-input" && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          Store.importAllJSON(reader.result);
          showToast("Progress backup imported");
        } catch (err) {
          showToast("Invalid JSON backup file");
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearchModal();
    } else if (e.key === "Escape") {
      document.querySelectorAll(".modal-backdrop.open").forEach((m) => m.classList.remove("open"));
    }
  });

  function init() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace("#", "");
    const validTabs = ["home", "subjects", "timetable", "pyqs", "insights"];
    if (validTabs.includes(params.get("tab"))) uiState.tab = params.get("tab");
    else if (validTabs.includes(hash)) uiState.tab = hash;
    if (params.get("sub") && DATA.subjects.some((s) => s.id === params.get("sub"))) {
      uiState.selectedSubjectId = params.get("sub");
    }

    const gsInput = document.getElementById("global-search-input");
    if (gsInput && DATA && DATA.subjects) {
      const totalTopicsCount = DATA.subjects.reduce((acc, s) => acc + (s.totalTopics || 0), 0);
      gsInput.placeholder = `Search ${totalTopicsCount} topics, formulas, or ${(DATA.pdfs || []).length} PDFs...`;
    }

    Store.subscribe(renderMain);
    renderMain();
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
