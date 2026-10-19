/* ============================================
   rank★d — List render (nel pane attivo)
   ============================================ */

let _allReviews  = [];

// Primo caricamento: scheletri ed errore a tutta lista. Aggiornamenti: la lista attuale resta
// visibile finché non arrivano i dati nuovi, e se falliscono non si perde niente.
async function loadAllReviews() {
  const first = _allReviews.length === 0;
  if (first) _showSkeletons();
  try {
    const data = await apiPost("reviews_get_all");
    if (!Array.isArray(data.reviews)) throw new Error(data.message || "risposta senza recensioni");
    _allReviews = data.reviews;
    _render(true);
  } catch(e) {
    console.error("loadAllReviews:", e);
    const list = document.getElementById("reviews-list");
    if (first) {
      list.innerHTML = '<div class="empty-state">Errore caricamento.<br>Riprova.</div>';
      return;
    }
    _render(false);   // rimette le card (toglie l'eventuale card "sto salvando")
    const note = document.createElement("button");
    note.type = "button";
    note.className = "entry-loading-card refresh-failed";
    note.textContent = "Non riesco ad aggiornare la lista · tocca per riprovare";
    note.addEventListener("click", refreshReviews);
    list.prepend(note);
  }
}

function _showSkeletons() {
  document.getElementById("reviews-list").innerHTML =
    Array.from({ length: 5 }).map(() => '<div class="skeleton-card"></div>').join("");
}

function refreshReviews() { return loadAllReviews(); }

function _render(animate) {
  const state = typeof _currentState !== "undefined" ? _currentState : "reviews";
  const cat   = typeof _currentCat   !== "undefined" ? _currentCat   : "ALL";

  let items = _allReviews;

  if (state === "wishlist")      items = items.filter(isWish);
  else if (state === "progress") items = items.filter(isProgress);
  else                           items = items.filter(r => !isWish(r) && !isProgress(r));

  if (cat !== "ALL") items = items.filter(r => getCleanCat(r) === cat);

  const list = document.getElementById("reviews-list");

  if (items.length === 0) {
    const msg = state === "wishlist" ? "Wishlist vuota"
              : state === "progress" ? "Niente in corso"
              : "Nessuna recensione qui";
    list.innerHTML = `<div class="empty-state">${msg}</div>`;
    return;
  }

  list.classList.remove("animate-in");
  list.innerHTML = items.map(_renderCard).join("");
  _bindCardClicks();
  if (typeof lucide !== "undefined") lucide.createIcons({ nodes: [list] });

  if (animate) {
    void list.offsetWidth;
    list.classList.add("animate-in");
  }
}

function _renderCard(r) {
  const cat      = getCleanCat(r);
  const emoji    = CAT_EMOJI[cat] || "🎭";
  const wish     = isWish(r);
  const progress = isProgress(r);

  const posterStyle = r.image_url ? `background-image:url('${escapeHtml(r.image_url)}')` : "";
  const badge = wish     ? '<span class="review-poster-badge wish">Wish</span>'
              : progress ? '<span class="review-poster-badge progress">In corso</span>'
              : "";
  const metaLabel = wish ? "Wish" : progress ? "In corso" : isDlc(r) ? "DLC" : cat;

  return `
    <div class="review-card" data-id="${escapeHtml(r.id)}" data-cat="${escapeHtml(cat)}">
      <div class="review-poster" style="${posterStyle}">
        ${r.image_url ? "" : `<div class="review-poster-placeholder">${emoji}</div>`}
        ${badge}
      </div>
      <div class="review-info">
        <div class="review-title">${escapeHtml(r.titolo)}</div>
        <div class="review-snippet">${escapeHtml(r.riassunto || r.commento)}</div>
        <div class="review-meta-row">
          <span class="review-rate-group">
            ${!wish && !progress && r.rating > 0
              ? `<span class="review-rating stars">${renderStars(r.rating)}</span>`
              : `<span class="review-rating"></span>`}
            ${r.liked ? `<span class="liked-mark" aria-label="Preferito">${heartSvg()}</span>` : ""}
          </span>
          <span class="cat-badge">${escapeHtml(metaLabel)}</span>
        </div>
      </div>
    </div>`;
}

function _bindCardClicks() {
  document.querySelectorAll(".review-card").forEach(card => {
    card.addEventListener("click", () => {
      const r = _allReviews.find(x => x.id === card.dataset.id);
      if (r) openDetail(r);
    });
  });
}
