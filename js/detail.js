/* ============================================
   rank★d — Detail modal
   ============================================ */

let _detailReview = null;

function openDetail(review) {
  _detailReview = review;
  const modal = document.getElementById("detail-modal");

  const wish     = isWish(review);
  const progress = isProgress(review);
  const cat      = getCleanCat(review);

  /* Colori della categoria della recensione (accent + deep) sul modale */
  const tok = CAT_TOKENS[cat] || CAT_TOKENS.ALL;
  modal.style.setProperty("--current-accent", tok.accent);
  modal.style.setProperty("--detail-bg", tok.deep);
  modal.style.setProperty("--current-rgb", tok.rgb);

  /* Hero: sfondo blurred + poster centrato */
  const heroBg     = document.getElementById("detail-hero-img");
  const heroPoster = document.getElementById("detail-hero-poster");
  const heroPh     = document.getElementById("detail-hero-placeholder");

  if (review.image_url) {
    heroBg.src = review.image_url;
    heroBg.classList.remove("hidden");
    heroPoster.src = review.image_url;
    heroPoster.classList.remove("hidden");
    heroPh.classList.add("hidden");
  } else {
    heroBg.classList.add("hidden");
    heroPoster.classList.add("hidden");
    heroPh.classList.remove("hidden");
    heroPh.textContent = CAT_EMOJI[cat] || "🎭";
  }

  /* Titolo */
  document.getElementById("detail-title").textContent = review.titolo || "";

  /* Rating */
  const ratingEl = document.getElementById("detail-rating");
  if (!wish && !progress && review.rating > 0) {
    ratingEl.innerHTML = renderStars(review.rating);
    ratingEl.classList.remove("hidden");
  } else {
    ratingEl.innerHTML = "";
    ratingEl.classList.add("hidden");
  }

  /* Badge */
  const badgeEl = document.getElementById("detail-cat-badge");
  badgeEl.textContent = cat;
  badgeEl.className   = "cat-badge" + (wish ? " wish" : progress ? " progress" : "");

  /* Metadata e data */
  document.getElementById("detail-metadata").textContent = review.metadata || "";
  document.getElementById("detail-date").textContent = formatDate(review.data);

  /* Commento */
  document.getElementById("detail-commento").textContent = review.commento || "";

  /* Pros / Cons */
  let pros = [], cons = [];
  try { pros = JSON.parse(review.pros || "[]"); } catch(e) {}
  try { cons = JSON.parse(review.cons || "[]"); } catch(e) {}

  const prosSection = document.getElementById("detail-pros-section");
  const consSection = document.getElementById("detail-cons-section");
  const pcWrap      = document.getElementById("detail-pros-cons-wrap");

  if (pros.length > 0 || cons.length > 0) {
    pcWrap.classList.remove("hidden");
    document.getElementById("detail-pros-list").innerHTML =
      pros.map(p => `<li>${escapeHtml(p)}</li>`).join("");
    document.getElementById("detail-cons-list").innerHTML =
      cons.map(c => `<li>${escapeHtml(c)}</li>`).join("");
    prosSection.classList.toggle("hidden", pros.length === 0);
    consSection.classList.toggle("hidden", cons.length === 0);
  } else {
    pcWrap.classList.add("hidden");
  }

  /* Promuovi */
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
  const btn  = document.getElementById("detail-promote-btn");
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = "…";

  const wish     = isWish(_detailReview);
  const cleanCat = getCleanCat(_detailReview);

  try {
    await apiPost("reviews_promote", { id: _detailReview.id, newCat: cleanCat });
    closeDetail();
    if (wish) {
      openEntry(_detailReview.titolo + " (" + cleanCat + ")");
    } else {
      refreshReviews();
    }
  } catch(e) {
    console.error("promoteReview:", e);
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
