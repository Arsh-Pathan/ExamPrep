/* SPPU SE Exam Studio — Interactive Study Guide & Solved QB Enhancer */
(function (global) {
  "use strict";

  const Store = global.ExamStore;
  const DATA = global.EXAM_DATA;

  if (Store && Store.applyTheme) {
    Store.applyTheme();
  }

  const THEME_ICONS = {
    light: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
    warm: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" opacity="0.28"/></svg>`,
    dark: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  };
  const THEME_LABELS = { light: "Light", warm: "Warm", dark: "Dark" };

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showToast(msg) {
    let el = document.getElementById("guide-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "guide-toast";
      el.className = "guide-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 2000);
  }

  function getSub() {
    const subId = document.body.dataset.subject;
    return (DATA && DATA.subjects || []).find((s) => s.id === subId) || { id: subId, short: (subId || "GUIDE").toUpperCase(), name: subId || "Guide", units: [] };
  }

  function fitWideMath() {
    const containers = document.querySelectorAll('mjx-container:not([display="true"])');
    containers.forEach((el) => el.classList.remove("mjx-wide"));
    containers.forEach((el) => {
      const parent = el.closest("li, p, td, th, .qa-q, .sol-header, .concept-box, .exam-tip, .formula-box, #main");
      if (!parent) return;
      const pw = parent.clientWidth;
      const ew = el.getBoundingClientRect().width;
      if (pw > 0 && ew > pw - 2) {
        el.classList.add("mjx-wide");
      }
    });
  }

  function buildChrome(sub) {
    const isSolvedQb = document.body.dataset.page === "solved-qb";
    const scrollBar = document.createElement("div");
    scrollBar.id = "guide-scroll-bar";
    document.body.prepend(scrollBar);

    let siblingLinkHtml = "";
    if (!isSolvedQb && sub.solvedQbHref) {
      siblingLinkHtml = `<a class="gtb-btn gtb-hide-sm" href="../${esc(sub.solvedQbHref)}">Solved QB</a>`;
    } else if (isSolvedQb && sub.href) {
      siblingLinkHtml = `<a class="gtb-btn gtb-hide-sm" href="../${esc(sub.href)}">Study Guide</a>`;
    }

    const topbar = document.createElement("header");
    topbar.id = "guide-topbar";
    topbar.innerHTML = `
      <div class="gtb-left">
        <a class="gtb-btn" href="../index.html">
          <span>&larr;</span>
          <span>Portal</span>
        </a>
        <span class="gtb-hide-sm" style="font-size:0.86rem;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(sub.name)}${isSolvedQb ? " &middot; Solved QB" : ""}</span>
      </div>
      <div class="gtb-right">
        ${siblingLinkHtml}
        <button id="gtb-practice-btn" class="gtb-btn" type="button" title="Hide answers to quiz yourself">Practice</button>
        <button id="gtb-notes-btn" class="gtb-btn gtb-hide-sm" type="button">Notes</button>
        <span id="gtb-progress-pill" class="gtb-progress-pill">0%</span>
        <button id="gtb-theme-btn" class="gtb-btn" type="button" title="Switch theme (Light / Warm / Dark)" aria-label="Switch theme">
          <span id="gtb-theme-icon">${THEME_ICONS.light}</span>
          <span id="gtb-theme-label" class="gtb-theme-lbl">Light</span>
        </button>
        <button id="gtb-user-btn" class="gtb-btn" type="button" title="Switch local student profile">
          <span id="gtb-user-dot" class="gtb-user-dot" style="background:#C2CBFA;">S</span>
          <span id="gtb-user-name" class="gtb-hide-sm">Student</span>
        </button>
        <button id="gtb-toc-btn" class="gtb-btn gtb-toc-only-mobile" type="button">Units</button>
      </div>
    `;
    document.body.prepend(topbar);

    const mobileNav = document.createElement("nav");
    mobileNav.id = "guide-mobile-nav";
    mobileNav.setAttribute("aria-label", "Quick guide actions");
    mobileNav.innerHTML = `
      <div class="gmn-pill">
        <a class="gmn-btn" href="../index.html">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z"/></svg>
          <span>Portal</span>
        </a>
        <button class="gmn-btn" id="gmn-units-btn" type="button">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/></svg>
          <span>Units</span>
        </button>
        <button class="gmn-btn" id="gmn-practice-btn" type="button">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.8-2.5 2-2.5 3.8"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg>
          <span>Quiz</span>
        </button>
        <button class="gmn-btn" id="gmn-notes-btn" type="button">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          <span>Notes</span>
        </button>
        <button class="gmn-btn" id="gmn-top-btn" type="button">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          <span>Top</span>
        </button>
      </div>
    `;
    document.body.appendChild(mobileNav);

    const modal = document.createElement("div");
    modal.id = "guide-modal";
    modal.className = "guide-modal-backdrop";
    modal.innerHTML = `<div class="guide-modal-sheet" id="guide-modal-sheet"></div>`;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });
  }

  function enhanceTablesAndCode() {
    const main = document.getElementById("main");
    if (!main) return;

    main.querySelectorAll("table").forEach((tbl) => {
      if (!tbl.closest(".table-wrap")) {
        const wrap = document.createElement("div");
        wrap.className = "table-wrap";
        tbl.parentNode.insertBefore(wrap, tbl);
        wrap.appendChild(tbl);
      }
    });

    main.querySelectorAll("pre").forEach((pre) => {
      if (pre.parentElement && pre.parentElement.classList.contains("pre-wrap")) return;
      const wrap = document.createElement("div");
      wrap.className = "pre-wrap";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy-btn";
      btn.textContent = "Copy";
      btn.addEventListener("click", () => {
        const codeText = pre.innerText || pre.textContent || "";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(codeText).then(() => {
            btn.textContent = "Copied";
            setTimeout(() => { btn.textContent = "Copy"; }, 1400);
          });
        } else {
          showToast("Copied code");
        }
      });
      wrap.appendChild(btn);
    });
  }

  
  function enhanceFlashcards() {
    const cards = document.querySelectorAll('.flashcard-card');
    cards.forEach((card) => {
      card.addEventListener('click', (e) => {
        // Prevent flipping if text selection was made
        const sel = window.getSelection();
        if (sel && sel.toString().length > 0) return;
        card.classList.toggle('is-flipped');
      });
    });

    const flipAll = document.getElementById('fc-flip-all');
    if (flipAll) {
      flipAll.addEventListener('click', () => {
        document.querySelectorAll('.flashcard-card').forEach((c) => c.classList.add('is-flipped'));
      });
    }

    const resetAll = document.getElementById('fc-reset-all');
    if (resetAll) {
      resetAll.addEventListener('click', () => {
        document.querySelectorAll('.flashcard-card').forEach((c) => c.classList.remove('is-flipped'));
      });
    }

    const unitFilter = document.getElementById('fc-unit-filter');
    if (unitFilter) {
      unitFilter.addEventListener('change', (e) => {
        const val = e.target.value;
        document.querySelectorAll('.flashcard-card').forEach((c) => {
          if (val === 'all' || c.getAttribute('data-unit') === val) {
            c.style.display = '';
          } else {
            c.style.display = 'none';
          }
        });
      });
    }
  }

function enhancePracticeCards() {
    const main = document.getElementById("main");
    if (!main) return;

    const cards = Array.from(main.querySelectorAll(".qa-card, .qa-block, .question-block, .sol-box"));
    cards.forEach((card) => {
      if (card.classList.contains("sol-box") && card.parentElement.closest(".qa-card, .qa-block, .question-block")) {
        return;
      }
      const head = card.querySelector(":scope > .qa-q, :scope > .q-head, :scope > .sol-header");
      if (!head) return;

      const siblings = [];
      let cur = head.nextSibling;
      while (cur) {
        const next = cur.nextSibling;
        siblings.push(cur);
        cur = next;
      }
      if (!siblings.length) return;

      const wrap = document.createElement("div");
      wrap.className = "practice-answer-wrap hidden-ans";

      const inner = document.createElement("div");
      inner.className = "practice-answer-inner";
      siblings.forEach((n) => inner.appendChild(n));

      const overlay = document.createElement("div");
      overlay.className = "practice-reveal-overlay";
      const revealBtn = document.createElement("button");
      revealBtn.type = "button";
      revealBtn.className = "reveal-btn";
      revealBtn.textContent = "Tap to reveal answer";
      revealBtn.addEventListener("click", () => {
        wrap.classList.remove("hidden-ans");
      });
      overlay.appendChild(revealBtn);

      wrap.appendChild(inner);
      wrap.appendChild(overlay);
      card.appendChild(wrap);
    });
  }

  function buildTrackers(sub) {
    if (document.body.dataset.page === "solved-qb") return;
    sub.units.forEach((un) => {
      const sec = document.getElementById(un.id);
      if (!sec) return;
      const h2 = sec.querySelector("h2");
      if (h2 && !sec.querySelector(".unit-progress-strip")) {
        const strip = document.createElement("div");
        strip.className = "unit-progress-strip";
        strip.dataset.unitStrip = un.id;
        strip.innerHTML = `
          <span class="unit-strip-text">0/${un.topics.length} topics done</span>
          <button type="button" class="unit-mark-btn" data-unit-toggle="${esc(un.id)}">Mark Unit Done</button>
        `;
        h2.insertAdjacentElement("afterend", strip);
      }

      un.topics.forEach((t) => {
        const anchorEl = document.getElementById(t.anchor);
        if (!anchorEl) return;

        let insertAfter = anchorEl;
        if (anchorEl.tagName.toLowerCase() === "section") {
          insertAfter = anchorEl.querySelector(".unit-progress-strip") || anchorEl.querySelector("h2") || anchorEl.firstElementChild;
        }
        if (!insertAfter) return;

        const bar = document.createElement("div");
        bar.className = "topic-inline-bar";
        bar.dataset.topicBar = t.id;
        bar.innerHTML = `
          <button type="button" class="tib-check" data-topic-check="${esc(t.id)}">Mark Done</button>
          <button type="button" class="tib-conf unseen" data-topic-conf="${esc(t.id)}" title="Cycle confidence level">Unseen</button>
          <button type="button" class="tib-star" data-topic-star="${esc(t.id)}" data-topic-title="${esc(t.title)}" data-topic-anchor="${esc(t.anchor)}" title="Pin bookmark">&#9734;</button>
        `;
        insertAfter.insertAdjacentElement("afterend", bar);
      });
    });
  }

  function syncUI(sub) {
    if (!Store) return;
    const theme = Store.applyTheme();
    const user = Store.getActiveUser();
    const st = Store.getSubjectStats(sub.id);

    const pill = document.getElementById("gtb-progress-pill");
    if (pill) {
      if (document.body.dataset.page === "solved-qb") {
        const qCount = document.querySelectorAll(".qa-card").length;
        pill.textContent = `${qCount} Qs Solved`;
      } else {
        pill.textContent = `${st.done}/${st.total} (${st.pct}%)`;
      }
    }

    const tIcon = document.getElementById("gtb-theme-icon");
    const tLabel = document.getElementById("gtb-theme-label");
    if (tIcon) tIcon.innerHTML = THEME_ICONS[theme] || THEME_ICONS.light;
    if (tLabel) tLabel.textContent = THEME_LABELS[theme] || "Light";

    const dot = document.getElementById("gtb-user-dot");
    const uname = document.getElementById("gtb-user-name");
    if (dot && user) {
      dot.style.background = user.avatarColor;
      dot.textContent = user.name.charAt(0).toUpperCase();
    }
    if (uname && user) uname.textContent = user.name;

    if (document.body.dataset.page === "solved-qb") return;

    sub.units.forEach((un) => {
      const strip = document.querySelector(`[data-unit-strip="${un.id}"]`);
      const doneCnt = un.topics.filter((t) => Store.getTopicState(sub.id, t.id).done).length;
      const allDone = doneCnt === un.topics.length && un.topics.length > 0;
      if (strip) {
        strip.querySelector(".unit-strip-text").textContent = `${doneCnt}/${un.topics.length} topics completed`;
        const btn = strip.querySelector(".unit-mark-btn");
        btn.textContent = allDone ? "Completed ✓" : "Mark Unit Done";
        btn.classList.toggle("all-done", allDone);
      }

      un.topics.forEach((t) => {
        const ts = Store.getTopicState(sub.id, t.id);
        const starred = Store.isBookmarked(sub.id, t.id);
        const bar = document.querySelector(`[data-topic-bar="${t.id}"]`);
        if (bar) {
          const chk = bar.querySelector(".tib-check");
          chk.classList.toggle("checked", ts.done);
          chk.innerHTML = ts.done ? "&#10003; Done" : "Mark Done";

          const conf = bar.querySelector(".tib-conf");
          const c = ts.confidence || "unseen";
          conf.className = `tib-conf ${c}`;
          conf.textContent = { unseen: "Unseen", revise: "Revise", good: "Good", mastered: "Mastered" }[c];

          const star = bar.querySelector(".tib-star");
          star.classList.toggle("active", starred);
          star.innerHTML = starred ? "&#9733;" : "&#9734;";
        }

        const sbLink = document.querySelector(`#sidebar a[href="#${CSS.escape(t.anchor)}"]`);
        if (sbLink) {
          sbLink.classList.toggle("topic-done", ts.done);
          let ind = sbLink.querySelector(".sb-done-dot");
          if (ts.done && !ind) {
            ind = document.createElement("span");
            ind.className = "sb-done-dot";
            sbLink.appendChild(ind);
          } else if (!ts.done && ind) {
            ind.remove();
          }
        }
      });
    });
  }

  function openUsersSheet() {
    const modal = document.getElementById("guide-modal");
    const sheet = document.getElementById("guide-modal-sheet");
    const active = Store.getActiveUser();
    const users = Store.getUsers();
    sheet.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 style="font-size:1.08rem;font-weight:800;">Student Profiles (Local)</h2>
        <button class="gtb-btn" id="gm-close" type="button">&times;</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
        ${users
          .map(
            (u) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:16px;border:1px solid ${u.id === active.id ? "var(--ink)" : "var(--border)"};background:${u.id === active.id ? "var(--hero-bg)" : "var(--surface-soft)"};">
            <div style="display:flex;align-items:center;gap:9px;">
              <span class="gtb-user-dot" style="background:${u.avatarColor};">${esc(u.name.charAt(0).toUpperCase())}</span>
              <span style="font-weight:700;font-size:0.88rem;">${esc(u.name)}</span>
            </div>
            ${
              u.id !== active.id
                ? `<button class="gtb-btn active" data-gm-switch="${u.id}" type="button">Switch</button>`
                : `<span class="pill" style="margin:0;">Active</span>`
            }
          </div>`
          )
          .join("")}
      </div>
      <form id="gm-new-user-form" style="display:flex;gap:8px;">
        <input id="gm-new-user-in" type="text" maxlength="32" placeholder="New student name..." style="flex:1;padding:9px 14px;border-radius:9999px;border:1px solid var(--border);background:var(--surface-soft);outline:none;" required />
        <button class="gtb-btn active" type="submit">Add</button>
      </form>
    `;
    modal.classList.add("open");
    sheet.querySelector("#gm-close").addEventListener("click", () => modal.classList.remove("open"));
    sheet.querySelectorAll("[data-gm-switch]").forEach((b) => {
      b.addEventListener("click", () => {
        Store.switchUser(b.dataset.gmSwitch);
        modal.classList.remove("open");
        showToast(`Switched to ${Store.getActiveUser().name}`);
      });
    });
    sheet.querySelector("#gm-new-user-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const val = sheet.querySelector("#gm-new-user-in").value;
      const u = Store.createUser(val);
      if (u) {
        modal.classList.remove("open");
        showToast(`Created profile ${u.name}`);
      }
    });
  }

  function openNotesSheet(sub) {
    const modal = document.getElementById("guide-modal");
    const sheet = document.getElementById("guide-modal-sheet");
    sheet.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h2 style="font-size:1.08rem;font-weight:800;">Revision Notes — ${esc(sub.short)}</h2>
        <button class="gtb-btn" id="gm-close" type="button">&times;</button>
      </div>
      <p style="font-size:0.78rem;color:var(--ink-muted);margin-bottom:10px;">Saved automatically per profile in localStorage.</p>
      <textarea id="gm-note-area" style="width:100%;min-height:170px;border-radius:16px;border:1px solid var(--border);background:var(--surface-soft);padding:12px;font-size:0.88rem;outline:none;">${esc(Store.getNote(sub.id))}</textarea>
    `;
    modal.classList.add("open");
    sheet.querySelector("#gm-close").addEventListener("click", () => modal.classList.remove("open"));
    sheet.querySelector("#gm-note-area").addEventListener("input", (e) => {
      Store.setNote(sub.id, e.target.value);
    });
  }

  function togglePracticeMode() {
    const on = document.body.classList.toggle("practice-mode");
    document.querySelectorAll(".practice-answer-wrap").forEach((w) => {
      if (on) w.classList.add("hidden-ans");
    });
    const topBtn = document.getElementById("gtb-practice-btn");
    const mobBtn = document.getElementById("gmn-practice-btn");
    if (topBtn) {
      topBtn.classList.toggle("active", on);
      topBtn.textContent = on ? "Exit Practice" : "Practice";
    }
    if (mobBtn) mobBtn.classList.toggle("active", on);
    showToast(on ? "Practice Mode ON: answers hidden" : "Practice Mode OFF");
  }

  function toggleSidebar() {
    const sb = document.getElementById("sidebar");
    if (sb) sb.classList.toggle("open");
  }

  function bindEvents(sub) {
    document.getElementById("gtb-practice-btn")?.addEventListener("click", togglePracticeMode);
    document.getElementById("gmn-practice-btn")?.addEventListener("click", togglePracticeMode);
    document.getElementById("gtb-toc-btn")?.addEventListener("click", toggleSidebar);
    document.getElementById("gmn-units-btn")?.addEventListener("click", toggleSidebar);
    document.getElementById("gtb-user-btn")?.addEventListener("click", openUsersSheet);
    document.getElementById("gtb-notes-btn")?.addEventListener("click", () => openNotesSheet(sub));
    document.getElementById("gmn-notes-btn")?.addEventListener("click", () => openNotesSheet(sub));
    document.getElementById("gmn-top-btn")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.getElementById("gtb-theme-btn")?.addEventListener("click", () => {
      if (Store) {
        const next = Store.cycleTheme();
        showToast(`Theme: ${THEME_LABELS[next] || next}`);
      }
    });

    document.getElementById("sidebar")?.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        document.getElementById("sidebar").classList.remove("open");
      }
    });

    document.addEventListener("click", (e) => {
      const chk = e.target.closest("[data-topic-check]");
      if (chk) {
        const res = Store.toggleTopicDone(sub.id, chk.dataset.topicCheck);
        showToast(res.done ? "Marked topic done ✓" : "Topic unchecked");
        return;
      }
      const conf = e.target.closest("[data-topic-conf]");
      if (conf) {
        const res = Store.cycleTopicConfidence(sub.id, conf.dataset.topicConf);
        showToast(`Confidence: ${res.confidence}`);
        return;
      }
      const star = e.target.closest("[data-topic-star]");
      if (star) {
        const added = Store.toggleBookmark({
          subId: sub.id,
          topicId: star.dataset.topicStar,
          title: star.dataset.topicTitle,
          href: `${sub.href}#${star.dataset.topicAnchor}`,
        });
        showToast(added ? "Pinned bookmark ★" : "Removed bookmark");
        return;
      }
      const unitBtn = e.target.closest("[data-unit-toggle]");
      if (unitBtn) {
        const un = sub.units.find((u) => u.id === unitBtn.dataset.unitToggle);
        if (!un) return;
        const doneCnt = un.topics.filter((t) => Store.getTopicState(sub.id, t.id).done).length;
        const markAll = doneCnt < un.topics.length;
        Store.markUnitDone(sub.id, un.id, markAll);
        showToast(markAll ? "Unit marked complete ✓" : "Unit unchecked");
      }
    });

    document.addEventListener("scroll", () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? Math.min(100, Math.max(0, (window.scrollY / docH) * 100)) : 0;
      const bar = document.getElementById("guide-scroll-bar");
      if (bar) bar.style.width = `${pct}%`;

      const links = document.querySelectorAll("#sidebar a[href^='#']");
      let current = "";
      for (const link of links) {
        const id = link.getAttribute("href").slice(1);
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${current}`));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const sub = getSub();
    buildChrome(sub);
    enhanceTablesAndCode();
    enhanceFlashcards();
    enhancePracticeCards();
    buildTrackers(sub);
    bindEvents(sub);
    if (Store) {
      Store.subscribe(() => syncUI(sub));
      syncUI(sub);
    }
    if (global.MathJax && global.MathJax.startup && global.MathJax.startup.promise) {
      global.MathJax.startup.promise.then(() => {
        setTimeout(fitWideMath, 60);
      });
    } else {
      setTimeout(fitWideMath, 700);
    }
    global.addEventListener("resize", fitWideMath);
  });
})(window);
