/* ============================================
   REEL — Detail modal
   ============================================ */

let _detailReview = null;

function openDetail(review) {
  _detailReview = review;
  const modal = document.getElementById("detail-modal");

  const wish     = isWish(review);
  const progress = isProgress(review);
  const cat      = getCleanCat(review);

  // Hero
  const heroEl = document.getElementById("detail-hero-img");
  if (review.image_url) {
    heroEl.src = review.image_url;
    heroEl.classList.remove("hidden");
    document.getElementById("detail-hero-placeholder").classList.add("hidden");
  } else {
    heroEl.classList.add("hidden");
    const ph = document.getElementById("detail-hero-placeholder");
    ph.classList.remove("hidden");
    ph.textContent = CAT_EMOJI[cat] || "🎭";
  }

  // Titolo e meta
  document.getElementById("detail-title").textContent = review.titolo || "";
  document.getElementById("detail-metadata").textContent = review.metadata || "";

  // Rating
  const ratingEl = document.getElementById("detail-rating");
  if (!wish && !progress) {
    ratingEl.innerHTML = '<span class="stars">' + renderStars(review.rating) + "</span>";
    ratingEl.classList.remove("hidden");
  } else {
    ratingEl.classList.add("hidden");
  }

  // Badge categoria
  const badgeEl = document.getElementById("detail-cat-badge");
  badgeEl.textContent = cat;
  badgeEl.className   = "cat-badge" + (wish ? " wish" : progress ? " progress" : "");

  // Data
  document.getElementById("detail-date").textContent = formatDate(review.data);

  // Commento
  document.getElementById("detail-commento").textContent = review.commento || "";

  // Pros / Cons
  let pros = [], cons = [];
  try { pros = JSON.parse(review.pros || "[]"); } catch(e) {}
  try { cons = JSON.parse(review.cons || "[]"); } catch(e) {}

  const prosSection = document.getElementById("detail-pros-section");
  const consSection = document.getElementById("detail-cons-section");

  if (pros.length > 0 || cons.length > 0) {
    document.getElementById("detail-pros-cons-wrap").classList.remove("hidden");
    document.getElementById("detail-pros-list").innerHTML = pros.map(p =>
      `<li>${escapeHtml(p)}</li>`).join("");
    document.getElementById("detail-cons-list").innerHTML = cons.map(c =>
      `<li>${escapeHtml(c)}</li>`).join("");
    prosSection.classList.toggle("hidden", pros.length === 0);
    consSection.classList.toggle("hidden", cons.length === 0);
  } else {
    document.getElementById("detail-pros-cons-wrap").classList.add("hidden");
  }

  // Pulsante Promuovi
  const promoteBtn = document.getElementById("detail-promote-btn");
  if (wish || progress) {
    promoteBtn.classList.remove("hidden");
    promoteBtn.textContent = wish ? "Promuovi a Recensione" : "Segna come Completato";
  } else {
    promoteBtn.classList.add("hidden");
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeDetail() {
  document.getElementById("detail-modal").classList.add("hidden");
  document.body.style.overflow = "";
  _detailReview = null;
}

async function promoteReview() {
  if (!_detailReview) return;
  const btn = document.getElementById("detail-promote-btn");
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = "…";

  const wish     = isWish(_detailReview);
  const cleanCat = getCleanCat(_detailReview);
  const newCat   = wish ? cleanCat : cleanCat; // rimuove WISH/IN_PROGRESS

  try {
    await apiPost("reviews_promote", { id: _detailReview.id, newCat });
    closeDetail();
    if (wish) {
      // Apre entry modal con titolo precompilato per scrivere la recensione completa
      openEntry(_detailReview.titolo + " (" + cleanCat + ")");
    } else {
      // Solo segna come completato (rimuove IN_PROGRESS)
      refreshReviews();
    }
  } catch(e) {
    console.error("promoteReview error:", e);
  }

  btn.textContent = orig;
  btn.disabled    = false;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("detail-close-btn").addEventListener("click", closeDetail);

  document.getElementById("detail-modal").addEventListener("click", e => {
    if (e.target === document.getElementById("detail-modal")) closeDetail();
  });

  document.getElementById("detail-promote-btn").addEventListener("click", promoteReview);
});
