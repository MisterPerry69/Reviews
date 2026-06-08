/* ============================================
   REEL — List view: cards, filtri, search, toggle
   ============================================ */

let _allReviews     = [];
let _currentCat     = "ALL";
let _currentView    = "reviews"; // "reviews" | "wishlist" | "progress"
let _searchQuery    = "";

// ---- Caricamento ----

async function loadAllReviews() {
  _showSkeletons();
  try {
    const data = await apiPost("reviews_get_all");
    _allReviews = data.reviews || [];
    _render();
  } catch(e) {
    console.error("loadAllReviews error:", e);
    document.getElementById("reviews-list").innerHTML =
      '<div class="empty-state">Errore caricamento. Riprova.</div>';
  }
}

function _showSkeletons() {
  const list = document.getElementById("reviews-list");
  list.innerHTML = Array.from({ length: 5 }).map(() =>
    '<div class="skeleton-card"></div>'
  ).join("");
}

// ---- Render ----

function _render() {
  let items = _allReviews;

  // Vista
  if (_currentView === "wishlist")  items = items.filter(isWish);
  if (_currentView === "progress")  items = items.filter(isProgress);
  if (_currentView === "reviews")   items = items.filter(r => !isWish(r) && !isProgress(r));

  // Filtro categoria
  if (_currentCat !== "ALL") {
    items = items.filter(r => getCleanCat(r) === _currentCat);
  }

  // Ricerca
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

  const posterStyle  = r.image_url
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
          ${!wish && !progress ? `<div class="review-rating stars">${renderStars(r.rating)}</div>` : ""}
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

// ---- Filtri categoria ----

function setCategory(cat, el) {
  _currentCat = cat;
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  _render();
}

// ---- Toggle viste ----

function setView(view) {
  _currentView = view;
  document.querySelectorAll(".view-chip").forEach(c => c.classList.remove("active"));
  const chip = document.getElementById("view-" + view);
  if (chip) chip.classList.add("active");

  const statsView = document.getElementById("stats-view");
  const listWrap  = document.getElementById("list-wrap");
  if (view === "stats") {
    statsView.classList.remove("hidden");
    listWrap.classList.add("hidden");
    renderStats(_allReviews);
  } else {
    statsView.classList.add("hidden");
    listWrap.classList.remove("hidden");
    _render();
  }
}

// ---- Search ----

document.addEventListener("DOMContentLoaded", () => {
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
});

// Esposta per detail.js e entry.js dopo promozione/aggiunta
function prependReview(review) {
  _allReviews.unshift(review);
  _render();
}

function refreshReviews() {
  loadAllReviews();
}
