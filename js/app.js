/* ============================================
   REEL — Init & shared utils
   ============================================ */

const CAT_EMOJI = {
  FILM:   "🎬",
  SERIE:  "📺",
  GAME:   "🎮",
  COMIC:  "📚",
};

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCleanCat(review) {
  return (review.categoria || "")
    .replace(/,?\s*WISH/i, "")
    .replace(/,?\s*IN_PROGRESS/i, "")
    .trim()
    .toUpperCase();
}

function isWish(review) {
  return (review.categoria || "").toUpperCase().includes("WISH");
}

function isProgress(review) {
  return (review.categoria || "").toUpperCase().includes("IN_PROGRESS");
}

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
  const [, mm, dd] = dateStr.split("-");
  const months = ["GEN","FEB","MAR","APR","MAG","GIU","LUG","AGO","SET","OTT","NOV","DIC"];
  return dd + " " + (months[parseInt(mm, 10) - 1] || mm);
}

// ---- Splash ----

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
  await Promise.all([
    _animateSplashBar(),
    loadAllReviews().catch(() => null),
  ]);

  const splash = document.getElementById("splash");
  document.getElementById("splash-bar").style.width = "100%";
  setTimeout(() => {
    splash.classList.add("fade-out");
    setTimeout(() => {
      splash.style.display = "none";
      document.getElementById("app").classList.remove("hidden");
      if (typeof lucide !== "undefined") lucide.createIcons();
    }, 480);
  }, 200);
});

// ---- Top tab navigation ----

function setTab(tab) {
  document.querySelectorAll(".section-tab").forEach(t => t.classList.remove("active"));
  const tabEl = document.getElementById("tab-" + tab);
  if (tabEl) tabEl.classList.add("active");

  const listView  = document.getElementById("list-view");
  const statsView = document.getElementById("stats-view");

  if (tab === "stats") {
    listView.classList.add("hidden");
    statsView.classList.remove("hidden");
    if (typeof renderStats === "function") renderStats(window._allReviewsCache || []);
  } else {
    statsView.classList.add("hidden");
    listView.classList.remove("hidden");
  }
}
