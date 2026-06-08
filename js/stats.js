/* ============================================
   REEL — Stats view
   ============================================ */

function renderStats(allReviews) {
  const reviews  = allReviews.filter(r => !isWish(r) && !isProgress(r));
  const wishlist = allReviews.filter(r => isWish(r));
  const progress = allReviews.filter(r => isProgress(r));

  // Hero
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "—";

  document.getElementById("stats-total").textContent    = reviews.length;
  document.getElementById("stats-avg").textContent      = avgRating;
  document.getElementById("stats-wishlist").textContent  = wishlist.length;
  document.getElementById("stats-progress").textContent  = progress.length;

  // Per categoria
  const cats = ["FILM", "SERIE", "GAME", "COMIC"];
  const catStats = {};
  cats.forEach(c => { catStats[c] = { count: 0, total: 0 }; });

  reviews.forEach(r => {
    const cat = getCleanCat(r);
    if (!catStats[cat]) catStats[cat] = { count: 0, total: 0 };
    catStats[cat].count++;
    catStats[cat].total += r.rating || 0;
  });

  const catList = document.getElementById("stats-cat-list");
  catList.innerHTML = cats.filter(c => catStats[c].count > 0).map(cat => {
    const s   = catStats[cat];
    const avg = s.count > 0 ? (s.total / s.count).toFixed(1) : "—";
    return `
      <div class="stats-cat-row">
        <div class="stats-cat-emoji">${CAT_EMOJI[cat] || "🎭"}</div>
        <div class="stats-cat-body">
          <div class="stats-cat-name">${cat}</div>
          <div class="stats-cat-count">${s.count} recension${s.count === 1 ? "e" : "i"}</div>
        </div>
        <div class="stats-cat-rating stars">${renderStars(parseFloat(avg) || 0)}</div>
      </div>`;
  }).join("") || '<div class="empty-state">Nessuna recensione</div>';

  // Top 5 per rating
  const top = [...reviews]
    .filter(r => r.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const topList = document.getElementById("stats-top-list");
  topList.innerHTML = top.map((r, i) => {
    const posterStyle = r.image_url ? `background-image: url('${escapeHtml(r.image_url)}')` : "";
    return `
      <div class="stats-top-item">
        <div class="stats-top-rank">${i + 1}</div>
        <div class="stats-top-poster" style="${posterStyle}"></div>
        <div class="stats-top-body">
          <div class="stats-top-title">${escapeHtml(r.titolo)}</div>
          <div class="stats-top-cat">${escapeHtml(getCleanCat(r))}</div>
        </div>
        <div class="stats-top-rating stars">${renderStars(r.rating)}</div>
      </div>`;
  }).join("") || '<div class="empty-state">Nessuna recensione con rating</div>';
}
