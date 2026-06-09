/* ============================================
   rank★d — List view: render + filtri
   ============================================ */

let _allReviews = [];
let _searchQuery = "";

window._allReviewsCache = _allReviews;

/* ---- Caricamento ---- */

async function loadAllReviews() {
  _showSkeletons();
  try {
    const data = await apiPost("reviews_get_all");
    _allReviews = data.reviews || [];
    window._allReviewsCache = _allReviews;
    _render();
  } catch(e) {
    console.error("loadAllReviews:", e);
    document.getElementById("reviews-list").innerHTML =
      '<div class="empty-state">Errore caricamento. Riprova.</div>';
  }
}

function _showSkeletons() {
  document.getElementById("reviews-list").innerHTML =
    Array.from({ length: 5 }).map(() => '<div class="skeleton-card"></div>').join("");
}

function refreshReviews() { loadAllReviews(); }

/* ---- Render ---- */

function _render() {
  const state = typeof _currentState !== "undefined" ? _currentState : "reviews";
  const cat   = typeof _currentCat   !== "undefined" ? _currentCat   : "ALL";

  let items = _allReviews;

  if (state === "wishlist")  items = items.filter(isWish);
  else if (state === "progress") items = items.filter(isProgress);
  else items = items.filter(r => !isWish(r) && !isProgress(r));

  if (cat !== "ALL") items = items.filter(r => getCleanCat(r) === cat);

  if (_searchQuery) {
    const q = _searchQuery.toLowerCase();
    items = items.filter(r =>
      (r.titolo    || "").toLowerCase().includes(q) ||
      (r.commento  || "").toLowerCase().includes(q) ||
      (r.metadata  || "").toLowerCase().includes(q) ||
      (r.riassunto || "").toLowerCase().includes(q)
    );
  }

  const list = document.getElementById("reviews-list");
  if (items.length === 0) {
    list.innerHTML = '<div class="empty-state">Nessuna voce trovata</div>';
    return;
  }
  list.innerHTML = items.map(_renderCard).join("");
  _bindCardClicks();
  if (typeof lucide !== "undefined") lucide.createIcons({ nodes: [list] });
}

function _renderCard(r) {
  const cat      = getCleanCat(r);
  const emoji    = CAT_EMOJI[cat] || "🎭";
  const wish     = isWish(r);
  const progress = isProgress(r);

  const posterStyle = r.image_url
    ? `background-image: url('${escapeHtml(r.image_url)}')`
    : "";
  const badge = wish
    ? '<span class="review-poster-badge wish">Wish</span>'
    : progress
    ? '<span class="review-poster-badge progress">In corso</span>'
    : "";

  const stateLabel = wish ? "Wish" : progress ? "In corso" : cat;
  const catBgClass = `cat-${cat.toLowerCase()}`;

  return `
    <div class="review-card" data-id="${escapeHtml(r.id)}" data-cat="${escapeHtml(cat)}">
      <div class="review-poster" style="${posterStyle}">
        ${r.image_url ? "" : `<div class="review-poster-placeholder">${emoji}</div>`}
        ${badge}
      </div>
      <div class="review-info">
        <div class="review-info-top">
          <div class="review-title">${escapeHtml(r.titolo)}</div>
          ${!wish && !progress && r.rating > 0
            ? `<div class="review-rating stars">${renderStars(r.rating)}</div>`
            : ""}
        </div>
        <div class="review-snippet">${escapeHtml(r.riassunto || r.commento)}</div>
        <div class="review-meta-row">
          <span class="cat-badge">${escapeHtml(stateLabel)}</span>
          <span class="review-date">${formatDate(r.data)}</span>
        </div>
      </div>
    </div>`;
}

function _bindCardClicks() {
  document.querySelectorAll(".review-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const review = _allReviews.find(r => r.id === id);
      if (review) openDetail(review);
    });
  });
}

/* ---- DOMContentLoaded ---- */

document.addEventListener("DOMContentLoaded", () => {
  // Nessun search input nell'HTML nuovo — niente da bindare qui
});
