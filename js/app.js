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

document.addEventListener("DOMContentLoaded", () => {
  loadAllReviews();
});
