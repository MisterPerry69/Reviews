/* ============================================
   rank★d — Init & shared utils
   ============================================ */

const CAT_EMOJI = { FILM: "🎬", SERIE: "📺", GAME: "🎮", COMIC: "📚" };

const CAT_TOKENS = {
  ALL:   { bg: "#1a1a2e", accent: "#e2d5b8" },
  FILM:  { bg: "#f97316", accent: "#ffffff" },
  SERIE: { bg: "#3b82f6", accent: "#ffffff" },
  GAME:  { bg: "#22c55e", accent: "#0d0d14" },
  COMIC: { bg: "#a855f7", accent: "#ffffff" },
};

const CATS = ["ALL", "FILM", "SERIE", "GAME", "COMIC"];

let _currentCat   = "ALL";
let _currentState = "reviews"; // "reviews" | "wishlist" | "progress" | "stats"

/* ---- Escape ---- */
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ---- Category helpers ---- */
function getCleanCat(review) {
  return (review.categoria || "")
    .replace(/,?\s*WISH/i, "").replace(/,?\s*IN_PROGRESS/i, "")
    .trim().toUpperCase();
}
function isWish(review)     { return (review.categoria || "").toUpperCase().includes("WISH"); }
function isProgress(review) { return (review.categoria || "").toUpperCase().includes("IN_PROGRESS"); }

/* ---- Stars ---- */
function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    "★".repeat(full) +
    (half ? '<span class="half">½</span>' : "") +
    '<span class="empty">' + "★".repeat(empty) + "</span>"
  );
}

/* ---- Date ---- */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [, mm, dd] = dateStr.split("-");
  const months = ["GEN","FEB","MAR","APR","MAG","GIU","LUG","AGO","SET","OTT","NOV","DIC"];
  return dd + " " + (months[parseInt(mm, 10) - 1] || mm);
}

/* ---- Color flood: aggiorna CSS vars su :root ---- */
function _applyColorTokens(cat) {
  const t = CAT_TOKENS[cat] || CAT_TOKENS.ALL;
  const root = document.documentElement.style;
  root.setProperty("--current-bg",     t.bg);
  root.setProperty("--current-accent", t.accent);
}

/* ---- Set category (tab + color flood) ---- */
function setCategory(cat) {
  if (cat === _currentCat) return;
  _currentCat = cat;

  document.querySelectorAll(".cat-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.cat === cat);
  });

  _applyColorTokens(cat);

  if (typeof _render === "function") _render();
}

/* ---- Set state (header icons) ---- */
function setHeaderState(state) {
  _currentState = state;

  document.querySelectorAll(".header-icon-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.state === state);
  });

  const listArea  = document.getElementById("list-area");
  const statsView = document.getElementById("stats-view");

  if (state === "stats") {
    listArea.classList.add("hidden");
    statsView.classList.remove("hidden");
    if (typeof renderStats === "function") renderStats(window._allReviewsCache || []);
  } else {
    statsView.classList.add("hidden");
    listArea.classList.remove("hidden");
    if (typeof _render === "function") _render();
  }
}

/* ---- Swipe between categories ---- */
function _initSwipe() {
  const area = document.getElementById("list-area");
  let startX = 0, startY = 0;

  area.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  area.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    if (Math.abs(dx) > 50 && dy < 60) {
      const idx = CATS.indexOf(_currentCat);
      if (dx < 0 && idx < CATS.length - 1) setCategory(CATS[idx + 1]);
      if (dx > 0 && idx > 0)               setCategory(CATS[idx - 1]);
    }
  }, { passive: true });
}

/* ---- Splash ---- */
function _animateSplashBar() {
  return new Promise(resolve => {
    const bar = document.getElementById("splash-bar");
    let pct = 0;
    const iv = setInterval(() => {
      pct += Math.random() * 14 + 4;
      if (pct >= 88) { pct = 88; clearInterval(iv); resolve(); }
      bar.style.width = pct + "%";
    }, 80);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Inizializza colori default
  _applyColorTokens("ALL");

  // Tab categorie
  document.querySelectorAll(".cat-tab").forEach(btn => {
    btn.addEventListener("click", () => setCategory(btn.dataset.cat));
  });

  // Header state icons
  document.querySelectorAll(".header-icon-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const s = btn.dataset.state;
      if (_currentState === s && s !== "stats") return;
      setHeaderState(s);
    });
  });

  // FAB
  document.getElementById("fab-new").addEventListener("click", () => openEntry());

  // Swipe
  _initSwipe();

  // Splash
  await Promise.all([
    _animateSplashBar(),
    loadAllReviews().catch(() => null),
  ]);

  document.getElementById("splash-bar").style.width = "100%";
  await new Promise(r => setTimeout(r, 200));

  const splash = document.getElementById("splash");
  splash.classList.add("fade-out");
  await new Promise(r => setTimeout(r, 480));
  splash.style.display = "none";
  document.getElementById("app").classList.remove("hidden");
  if (typeof lucide !== "undefined") lucide.createIcons();
});
