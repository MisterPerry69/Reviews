/* ============================================
   rank★d — Init, cartellina carosello, utils
   ============================================ */

const CAT_EMOJI = { FILM: "🎬", SERIE: "📺", GAME: "🎮", COMIC: "📚" };

/* page (pastello cartella), accent (saturo), card (crema), deep (scuro per il dettaglio), rgb */
const CAT_TOKENS = {
  // ALL: Un grigio/crema moderno e pulito, non stancante
  ALL:   { page: "#f4f4f6", accent: "#2c3e50", card: "#ffffff", deep: "#1a1a1a", rgb: "44,62,80" },
  
  // FILM: Un bel color salmone/arancio bruciato deciso
  FILM:  { page: "#fbe9e7", accent: "#dd2c00", card: "#ffffff", deep: "#3e2723", rgb: "221,44,0" },
  
  // SERIE: Un azzurro cielo saturo che sa di display
  SERIE: { page: "#e3f2fd", accent: "#0d47a1", card: "#ffffff", deep: "#0d1b2a", rgb: "13,71,161" },
  
  // GAME: Un verde menta energetico
  GAME:  { page: "#e8f5e9", accent: "#1b5e20", card: "#ffffff", deep: "#004d40", rgb: "27,94,32" },
  
  // COMIC: Un lilla pop molto giovanile
  COMIC: { page: "#f3e5f5", accent: "#4a148c", card: "#ffffff", deep: "#311b92", rgb: "74,20,140" },
};

const CATS = ["ALL", "FILM", "SERIE", "GAME", "COMIC"];

/* Icone tab (SVG inline) */
const CAT_ICONS = {
  ALL:   `<svg class="cat-tab-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="6.5" cy="6.5" r="3"/><circle cx="17.5" cy="6.5" r="3"/><circle cx="6.5" cy="17.5" r="3"/><circle cx="17.5" cy="17.5" r="3"/></svg>`,
  FILM:  `<svg class="cat-tab-icon stroke" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="5" width="19" height="14" rx="3"/><line x1="7" y1="5" x2="7" y2="19"/><line x1="17" y1="5" x2="17" y2="19"/><line x1="2.5" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21.5" y2="12"/></svg>`,
  SERIE: `<svg class="cat-tab-icon stroke" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="4.5" width="19" height="13" rx="3"/><path d="M8.5 21h7"/><path d="M12 17.5V21"/></svg>`,
  GAME:  `<svg class="cat-tab-icon stroke" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M17 5.5H7A5 5 0 0 0 2 10.5v3a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5v-3a5 5 0 0 0-5-5z"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15.5" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="13.5" r="1" fill="currentColor" stroke="none"/></svg>`,
  COMIC: `<svg class="cat-tab-icon stroke" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v15.5H7.5A2.5 2.5 0 0 0 5 20V4.5z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 20H19"/></svg>`,
};

let _currentCat   = "ALL";
let _currentIdx   = 0;
let _currentState = "reviews";
let _dragAccentCat = "ALL";

/* ── Helpers ── */
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function getCleanCat(r) {
  return (r.categoria || "").replace(/,?\s*WISH/i, "").replace(/,?\s*IN_PROGRESS/i, "").trim().toUpperCase();
}
function isWish(r)     { return (r.categoria || "").toUpperCase().includes("WISH"); }
function isProgress(r) { return (r.categoria || "").toUpperCase().includes("IN_PROGRESS"); }

/* Stelle SVG: piena / mezza / vuota */
function _starSvg(kind) {
  const path = "M12 2.4l2.96 6 6.62.96-4.79 4.67 1.13 6.59L12 17.5 6.08 20.62l1.13-6.59L2.42 9.36 9.04 8.4 12 2.4z";
  if (kind === "full") return `<svg class="star full" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  if (kind === "half") {
    const id = "hg" + Math.random().toString(36).slice(2, 8);
    return `<svg class="star half" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path d="${path}" fill="url(#${id})"/><path d="${path}" class="star-outline"/></svg>`;
  }
  return `<svg class="star empty" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
}
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  let out = "";
  for (let i = 0; i < full; i++)  out += _starSvg("full");
  if (half)                       out += _starSvg("half");
  for (let i = 0; i < empty; i++) out += _starSvg("empty");
  return out;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const p = dateStr.split("-");
  if (p.length < 3) return dateStr;
  const m = ["GEN","FEB","MAR","APR","MAG","GIU","LUG","AGO","SET","OTT","NOV","DIC"];
  return p[2] + " " + (m[parseInt(p[1], 10) - 1] || p[1]);
}

/* ── Applica accent/card correnti su :root (per stelle, badge, FAB, modali) ── */
function _applyTokens(cat) {
  const t = CAT_TOKENS[cat] || CAT_TOKENS.ALL;
  const s = document.documentElement.style;
  s.setProperty("--current-page",   t.page);
  s.setProperty("--current-accent", t.accent);
  s.setProperty("--current-card",   t.card);
  s.setProperty("--current-rgb",    t.rgb);
}


/* ── Icone categoria FISSE (una riga sola, non scorre) ── */
function _buildTabs() {
  const nav = document.getElementById("cat-tabs");
  nav.querySelectorAll(".cat-tab").forEach(btn => {
    btn.innerHTML = CAT_ICONS[btn.dataset.cat];
    btn.addEventListener("click", () => setCategory(btn.dataset.cat));
  });
}
function _markActiveTab(cat) {
  document.querySelectorAll("#cat-tabs .cat-tab").forEach(b =>
    b.classList.toggle("active", b.dataset.cat === cat));
}

/* ════════════════════════════════
   CARTELLE — blocco colorato pieno (angoli arrotondati in alto).
   5 cartelle affiancate in #folder-track (width 500%); scorrono col swipe.
════════════════════════════════ */
function _buildFolders() {
  const track = document.getElementById("folder-track");
  track.innerHTML = CATS.map(cat =>
    `<div class="folder" data-cat="${cat}" style="--folder-page:${CAT_TOKENS[cat].page}"></div>`
  ).join("");
}

/* ── Posiziona il track all'indice (frazionario durante drag) ── */
function _positionTrack(idxFloat) {
  const track = document.getElementById("folder-track");
  track.style.transform = `translateX(${-idxFloat * 20}%)`;
}

/* ════════════════════════════════
   DRAG — tutta la cartellina scorre (tab-row + pannello insieme).
════════════════════════════════ */
function _initCarousel() {
  const deck = document.getElementById("cat-deck");
  const track = document.getElementById("folder-track");
  const listScroll = document.getElementById("list-scroll");

  let startX = 0, startY = 0;
  let dragging = false, decided = false, horizontal = false;
  let deckW = deck.offsetWidth;

  function onStart(e) {
    if (_currentState === "stats") return;
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX; startY = t.clientY;
    deckW = deck.offsetWidth;
    dragging = true; decided = false; horizontal = false;
    _dragAccentCat = _currentCat;
    track.style.transition = "none";
    listScroll.style.transition = "none";
  }

  function onMove(e) {
    if (!dragging) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (!decided) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      horizontal = Math.abs(dx) > Math.abs(dy);
      decided = true;
    }
    if (!horizontal) return;
    e.preventDefault && e.preventDefault();

    let eff = dx;
    const atStart = _currentIdx === 0 && dx > 0;
    const atEnd   = _currentIdx === CATS.length - 1 && dx < 0;
    if (atStart || atEnd) eff = dx * 0.32;

    const frac = -eff / deckW;
    let idxFloat = Math.max(0, Math.min(CATS.length - 1, _currentIdx + frac));
    _positionTrack(idxFloat);

    // le card scorrono via insieme al dito (non in fade)
    listScroll.style.transform = `translateX(${eff}px)`;

    // accent della pillola/header segue la categoria più vicina mentre trascini
    const nearest = Math.round(idxFloat);
    if (CATS[nearest] !== _dragAccentCat) {
      _dragAccentCat = CATS[nearest];
      const tk = CAT_TOKENS[_dragAccentCat];
      const s = document.documentElement.style;
      s.setProperty("--current-accent", tk.accent);
      s.setProperty("--current-rgb", tk.rgb);
      _markActiveTab(_dragAccentCat);
    }
  }

  function onEnd(e) {
    if (!dragging) return;
    dragging = false;
    if (!horizontal) { listScroll.style.transform = ""; return; }

    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - startX;
    const threshold = deckW * 0.20;

    let target = _currentIdx;
    if (dx < -threshold && _currentIdx < CATS.length - 1) target = _currentIdx + 1;
    else if (dx > threshold && _currentIdx > 0)           target = _currentIdx - 1;

    _snapTo(target, dx < 0 ? 1 : -1);
  }

  deck.addEventListener("touchstart", onStart, { passive: true });
  deck.addEventListener("touchmove",  onMove,  { passive: false });
  deck.addEventListener("touchend",   onEnd,   { passive: true });
}

/* ── Snap: il colore rimbalza; le card vecchie escono di lato, poi le nuove entrano a cascata ── */
function _snapTo(idx, dir) {
  const track = document.getElementById("folder-track");
  const listScroll = document.getElementById("list-scroll");
  const changed = idx !== _currentIdx;
  const w = document.getElementById("cat-deck").offsetWidth;

  track.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
  _currentIdx = idx;
  _currentCat = CATS[idx];
  _positionTrack(idx);
  _markActiveTab(_currentCat);
  _applyTokens(_currentCat);

  if (!changed) {
    // torna in posizione con un piccolo rimbalzo
    listScroll.style.transition = "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)";
    listScroll.style.transform = "translateX(0)";
    return;
  }

  // direzione di uscita = verso dove ho swipato
  const outX = (dir > 0 ? -1 : 1) * w;
  listScroll.style.transition = "transform 0.26s ease-in";
  listScroll.style.transform = `translateX(${outX}px)`;

  setTimeout(() => {
    // render nuove card, posizionate fuori dal lato opposto, pronte a entrare
    if (typeof _render === "function") _render(false);
    listScroll.style.transition = "none";
    listScroll.style.transform = `translateX(${-outX}px)`;
    void listScroll.offsetWidth;
    // rientro con bounce + cascata
    listScroll.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
    listScroll.style.transform = "translateX(0)";
    _triggerCascade();
  }, 260);
}

/* riattiva l'animazione a cascata delle card */
function _triggerCascade() {
  const list = document.getElementById("reviews-list");
  if (!list) return;
  list.classList.remove("animate-in");
  void list.offsetWidth;
  list.classList.add("animate-in");
}

/* ── Cambio da tap su tab ── */
function setCategory(cat) {
  const idx = CATS.indexOf(cat);
  if (idx < 0) return;
  const dir = idx > _currentIdx ? 1 : -1;   // direzione coerente con la posizione
  _snapTo(idx, dir);
}

/* ── Icone header: stato ── */
function setHeaderState(state) {
  _currentState = state;
  document.querySelectorAll(".header-icon-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.state === state));

  const deck = document.getElementById("cat-deck");
  const statsView = document.getElementById("stats-view");
  const tabs = document.getElementById("cat-tabs");

  if (state === "stats") {
    deck.classList.add("hidden");
    statsView.classList.remove("hidden");
    tabs.classList.add("hidden");            // nascondi pillola categorie in stats
    if (typeof renderStats === "function") renderStats(window._allReviewsCache || []);
  } else {
    statsView.classList.add("hidden");
    deck.classList.remove("hidden");
    tabs.classList.remove("hidden");
    if (typeof _render === "function") _render(true);
  }
}

/* ── FAB launch ── */
function _launchFab() {
  const fab = document.getElementById("fab-new");
  fab.classList.remove("launching");
  void fab.offsetWidth;
  fab.classList.add("launching");
  setTimeout(() => openEntry(), 260);
  setTimeout(() => fab.classList.remove("launching"), 420);
}

/* ════════════════════════════════ BOOT ════════════════════════════════ */
document.addEventListener("DOMContentLoaded", async () => {
  _applyTokens("ALL");
  _buildTabs();
  _buildFolders();
  _markActiveTab("ALL");

  document.querySelectorAll(".header-icon-btn").forEach(btn => {
    btn.addEventListener("click", () => setHeaderState(btn.dataset.state));
  });
  document.getElementById("fab-new").addEventListener("click", _launchFab);

  _initCarousel();

  await loadAllReviews().catch(() => null);
  await new Promise(r => setTimeout(r, 1100));

  const splash = document.getElementById("splash");
  splash.classList.add("fade-out");
  await new Promise(r => setTimeout(r, 440));
  splash.style.display = "none";

  document.getElementById("app").classList.remove("hidden");
  if (typeof lucide !== "undefined") lucide.createIcons();

  requestAnimationFrame(() => {
    _positionTrack(_currentIdx);
    if (typeof _render === "function") _render(true);
  });
});
