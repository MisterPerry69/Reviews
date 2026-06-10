/* ============================================
   rank★d — Init, utils, navigazione
   ============================================ */

const CAT_EMOJI = { FILM: "🎬", SERIE: "📺", GAME: "🎮", COMIC: "📚" };

/* Colori per ogni categoria — applicati su :root */
const CAT_TOKENS = {
  ALL:   { accent: "#e2d5b8", bg: "#0b0b10" },
  FILM:  { accent: "#f97316", bg: "#1a0a00" },
  SERIE: { accent: "#3b82f6", bg: "#00091a" },
  GAME:  { accent: "#16a34a", bg: "#001a0a" },
  COMIC: { accent: "#9333ea", bg: "#0e001a" },
};

const CATS = ["ALL", "FILM", "SERIE", "GAME", "COMIC"];

let _currentCat   = "ALL";
let _currentState = "reviews"; // "reviews" | "progress" | "wishlist" | "stats"

/* ── Helpers ── */
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function getCleanCat(review) {
  return (review.categoria || "")
    .replace(/,?\s*WISH/i, "").replace(/,?\s*IN_PROGRESS/i, "")
    .trim().toUpperCase();
}

function isWish(review)     { return (review.categoria || "").toUpperCase().includes("WISH"); }
function isProgress(review) { return (review.categoria || "").toUpperCase().includes("IN_PROGRESS"); }

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

function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const months = ["GEN","FEB","MAR","APR","MAG","GIU","LUG","AGO","SET","OTT","NOV","DIC"];
  return parts[2] + " " + (months[parseInt(parts[1], 10) - 1] || parts[1]);
}

/* ── Color flood ── */
function _applyTokens(cat) {
  const t = CAT_TOKENS[cat] || CAT_TOKENS.ALL;
  const s = document.documentElement.style;
  s.setProperty("--current",    t.accent);
  s.setProperty("--current-bg", t.bg);
}

/* ── Tab categoria + flood ── */
function setCategory(cat) {
  if (cat === _currentCat) return;
  _currentCat = cat;

  document.querySelectorAll(".cat-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.cat === cat);
  });

  _applyTokens(cat);

  if (typeof _render === "function") _render();
}

/* ── Icone header: stato lista ── */
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

/* ── Swipe tra categorie ── */
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
    if (Math.abs(dx) > 48 && dy < 60) {
      const idx = CATS.indexOf(_currentCat);
      if (dx < 0 && idx < CATS.length - 1) setCategory(CATS[idx + 1]);
      if (dx > 0 && idx > 0)               setCategory(CATS[idx - 1]);
    }
  }, { passive: true });
}

/* ── Splash ── */
function _animateSplashBar() {
  return new Promise(resolve => {
    const bar = document.getElementById("splash-bar");
    let pct = 0;
    const iv = setInterval(() => {
      pct += Math.random() * 16 + 5;
      if (pct >= 88) { pct = 88; clearInterval(iv); resolve(); }
      bar.style.width = pct + "%";
    }, 80);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  /* Colori iniziali */
  _applyTokens("ALL");

  /* Tab categorie */
  document.querySelectorAll(".cat-tab").forEach(btn => {
    btn.addEventListener("click", () => setCategory(btn.dataset.cat));
  });

  /* Header state icons */
  document.querySelectorAll(".header-icon-btn").forEach(btn => {
    btn.addEventListener("click", () => setHeaderState(btn.dataset.state));
  });

  /* FAB */
  document.getElementById("fab-new").addEventListener("click", () => openEntry());

  /* Swipe */
  _initSwipe();

  /* Splash */
  await Promise.all([
    _animateSplashBar(),
    loadAllReviews().catch(() => null),
  ]);

  document.getElementById("splash-bar").style.width = "100%";
  await new Promise(r => setTimeout(r, 180));

  const splash = document.getElementById("splash");
  splash.classList.add("fade-out");
  await new Promise(r => setTimeout(r, 420));
  splash.style.display = "none";

  const app = document.getElementById("app");
  app.classList.remove("hidden");
  if (typeof lucide !== "undefined") lucide.createIcons();
});
