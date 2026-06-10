/* ============================================
   rank★d — Init, navigazione, animazioni
   ============================================ */

const CAT_EMOJI = { FILM: "🎬", SERIE: "📺", GAME: "🎮", COMIC: "📚" };

/* accent + bg flood + rgb (per le ombre) di ogni categoria */
const CAT_TOKENS = {
  ALL:   { accent: "#ffb627", bg: "#221c10", rgb: "255,182,39"  },
  FILM:  { accent: "#ff6b35", bg: "#2a1006", rgb: "255,107,53"  },
  SERIE: { accent: "#4d96ff", bg: "#08152e", rgb: "77,150,255"  },
  GAME:  { accent: "#2bd576", bg: "#06241a", rgb: "43,213,118"  },
  COMIC: { accent: "#b06bff", bg: "#1c0a2e", rgb: "176,107,255" },
};

const CATS = ["ALL", "FILM", "SERIE", "GAME", "COMIC"];

let _currentCat   = "ALL";
let _currentState = "reviews";

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

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) +
    (half ? '<span class="half">½</span>' : "") +
    '<span class="empty">' + "★".repeat(empty) + "</span>";
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  const p = dateStr.split("-");
  if (p.length < 3) return dateStr;
  const m = ["GEN","FEB","MAR","APR","MAG","GIU","LUG","AGO","SET","OTT","NOV","DIC"];
  return p[2] + " " + (m[parseInt(p[1], 10) - 1] || p[1]);
}

/* ── Applica colori categoria su :root ── */
function _applyTokens(cat) {
  const t = CAT_TOKENS[cat] || CAT_TOKENS.ALL;
  const s = document.documentElement.style;
  s.setProperty("--current",     t.accent);
  s.setProperty("--current-bg",  t.bg);
  s.setProperty("--current-rgb", t.rgb);
}

/* ── Posiziona la pill scorrevole sotto la tab attiva ── */
function _movePill(animate) {
  const tabs = document.getElementById("cat-tabs");
  const pill = document.getElementById("tab-indicator");
  const active = tabs.querySelector(".cat-tab.active");
  if (!active || !pill) return;

  // primo posizionamento senza transizione (evita lo "scivolone" da 0)
  if (!animate) {
    const prev = pill.style.transition;
    pill.style.transition = "none";
    pill.style.width = active.offsetWidth + "px";
    pill.style.transform = `translateX(${active.offsetLeft - 6}px)`;
    void pill.offsetWidth;
    pill.style.transition = prev;
    return;
  }

  pill.style.width = active.offsetWidth + "px";
  pill.style.transform = `translateX(${active.offsetLeft - 6}px)`;
}

/* ── Flood a tendina dal lato del cambio ── */
function _playFlood(toCat, direction) {
  const veil = document.getElementById("flood-veil");
  const t = CAT_TOKENS[toCat] || CAT_TOKENS.ALL;
  veil.style.setProperty("--flood-color", t.bg);

  veil.classList.remove("flood-from-left", "flood-from-right");
  void veil.offsetWidth;
  veil.classList.add(direction > 0 ? "flood-from-right" : "flood-from-left");
}

/* ── Cambio categoria (con flood + stagger) ── */
function setCategory(cat, direction) {
  if (cat === _currentCat) return;

  const prevIdx = CATS.indexOf(_currentCat);
  const newIdx  = CATS.indexOf(cat);
  const dir = typeof direction === "number" ? direction : (newIdx > prevIdx ? 1 : -1);

  _currentCat = cat;

  document.querySelectorAll(".cat-tab").forEach(b =>
    b.classList.toggle("active", b.dataset.cat === cat));

  _applyTokens(cat);
  _movePill(true);
  _playFlood(cat, dir);

  // attendi metà flood, poi swappa il contenuto sotto il velo
  setTimeout(() => { if (typeof _render === "function") _render(true); }, 230);
}

/* ── Icone header: stato ── */
function setHeaderState(state) {
  _currentState = state;
  document.querySelectorAll(".header-icon-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.state === state));

  const listArea  = document.getElementById("list-area");
  const statsView = document.getElementById("stats-view");

  if (state === "stats") {
    listArea.classList.add("hidden");
    statsView.classList.remove("hidden");
    if (typeof renderStats === "function") renderStats(window._allReviewsCache || []);
  } else {
    statsView.classList.add("hidden");
    listArea.classList.remove("hidden");
    if (typeof _render === "function") _render(true);
  }
}

/* ── Swipe ── */
function _initSwipe() {
  const area = document.getElementById("list-area");
  let startX = 0, startY = 0, tracking = false;

  area.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  area.addEventListener("touchend", e => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    if (Math.abs(dx) > 55 && dy < 50) {
      const idx = CATS.indexOf(_currentCat);
      if (dx < 0 && idx < CATS.length - 1) setCategory(CATS[idx + 1], 1);
      if (dx > 0 && idx > 0)               setCategory(CATS[idx - 1], -1);
    }
  }, { passive: true });
}

/* ── Splash ── */
document.addEventListener("DOMContentLoaded", async () => {
  _applyTokens("ALL");

  document.querySelectorAll(".cat-tab").forEach(btn => {
    btn.addEventListener("click", () => setCategory(btn.dataset.cat));
  });
  document.querySelectorAll(".header-icon-btn").forEach(btn => {
    btn.addEventListener("click", () => setHeaderState(btn.dataset.state));
  });
  document.getElementById("fab-new").addEventListener("click", () => openEntry());

  _initSwipe();
  window.addEventListener("resize", () => _movePill(false));

  await loadAllReviews().catch(() => null);

  // splash min 1.1s per far vedere il blob
  await new Promise(r => setTimeout(r, 1100));

  const splash = document.getElementById("splash");
  splash.classList.add("fade-out");
  await new Promise(r => setTimeout(r, 440));
  splash.style.display = "none";

  const app = document.getElementById("app");
  app.classList.remove("hidden");
  if (typeof lucide !== "undefined") lucide.createIcons();

  // posiziona la pill ora che il layout è visibile
  requestAnimationFrame(() => {
    _movePill(false);
    if (typeof _render === "function") _render(true);
  });
});
