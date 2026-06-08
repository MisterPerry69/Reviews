/* ============================================
   REEL — List view: cards, filtri, search
   ============================================ */

let _allReviews   = [];
let _currentType  = "reviews"; // "reviews" | "wishlist" | "progress"
let _currentCat   = "ALL";
let _searchQuery  = "";

window._allReviewsCache = _allReviews; // riferimento per stats

// ---- Caricamento ----

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

// ---- Render ----

function _render() {
  let items = _allReviews;

  if (_currentType === "wishlist")  items = items.filter(isWish);
  if (_currentType === "progress")  items = items.filter(isProgress);
  if (_currentType === "reviews")   items = items.filter(r => !isWish(r) && !isProgress(r));

  if (_currentCat !== "ALL") {
    items = items.filter(r => getCleanCat(r) === _currentCat);
  }

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
    list.innerHTML = '<div class="empty-state">Nessuna recensione trovata</div>';
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

  return `
    <div class="review-card" data-id="${escapeHtml(r.id)}">
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
          <span class="cat-badge${wish ? " wish" : progress ? " progress" : ""}">${escapeHtml(cat)}</span>
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

// ---- Filtro tipo (Tutte / Wishlist / In corso) ----

function setType(type, el) {
  _currentType = type;
  document.querySelectorAll(".type-chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  _render();
}

// ---- Filtro categoria (select) ----

function refreshReviews() {
  loadAllReviews();
}

document.addEventListener("DOMContentLoaded", () => {
  // Search
  const input    = document.getElementById("search-input");
  const clearBtn = document.getElementById("search-clear");

  input.addEventListener("input", () => {
    _searchQuery = input.value.trim();
    clearBtn.classList.toggle("hidden", !_searchQuery);
    _render();
  });

  clearBtn.addEventListener("click", () => {
    input.value  = "";
    _searchQuery = "";
    clearBtn.classList.add("hidden");
    _render();
  });

  // Categoria select
  const catSelect = document.getElementById("cat-select");
  catSelect.addEventListener("change", () => {
    _currentCat = catSelect.value || "ALL";
    _render();
  });
});
