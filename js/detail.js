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

  /* Rigenera: solo se c'è il testo grezzo originale */
  const regenBtn = document.getElementById("detail-regen-btn");
  regenBtn.classList.toggle("hidden", !(review.raw_text && review.raw_text.trim()));

  /* Parti sempre in view mode */
  exitEditMode();

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  if (window.lucide) lucide.createIcons();
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

/* ════════════════════════════════════
   EDIT MODE — modifica manuale inline
════════════════════════════════════ */

function _pcRow(value, target) {
  const wrap = document.createElement("div");
  wrap.className = "edit-pc-item";
  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = value || "";
  inp.placeholder = target === "pros" ? "Un pro…" : "Un contro…";
  const rm = document.createElement("button");
  rm.type = "button";
  rm.className = "btn-pc-remove";
  rm.textContent = "×";
  rm.addEventListener("click", () => wrap.remove());
  wrap.append(inp, rm);
  return wrap;
}

function _renderEditablePC(target, items) {
  const list = document.getElementById(target === "pros" ? "edit-pros-list" : "edit-cons-list");
  list.innerHTML = "";
  (items || []).forEach(v => list.appendChild(_pcRow(v, target)));
}

function enterEditMode() {
  if (!_detailReview) return;
  const r = _detailReview;

  document.getElementById("edit-titolo").value   = r.titolo || "";
  document.getElementById("edit-categoria").value = getCleanCat(r) || "FILM";
  document.getElementById("edit-rating").value   = String(r.rating || 0);
  document.getElementById("edit-stato").value    = isWish(r) ? "WISH" : isProgress(r) ? "IN_PROGRESS" : "";
  document.getElementById("edit-metadata").value = r.metadata || "";
  document.getElementById("edit-commento").value = r.commento || "";

  let pros = [], cons = [];
  try { pros = JSON.parse(r.pros || "[]"); } catch(e) {}
  try { cons = JSON.parse(r.cons || "[]"); } catch(e) {}
  _renderEditablePC("pros", pros);
  _renderEditablePC("cons", cons);

  document.getElementById("detail-view").classList.add("hidden");
  document.getElementById("detail-edit").classList.remove("hidden");
  document.querySelector("#detail-modal .detail-body").scrollTop = 0;
}

function exitEditMode() {
  document.getElementById("detail-edit").classList.add("hidden");
  document.getElementById("detail-view").classList.remove("hidden");
}

function _collectPC(target) {
  const list = document.getElementById(target === "pros" ? "edit-pros-list" : "edit-cons-list");
  return Array.from(list.querySelectorAll("input"))
    .map(i => i.value.trim())
    .filter(v => v.length > 0);
}

async function saveEdit() {
  if (!_detailReview) return;
  const stato = document.getElementById("edit-stato").value;
  let cat = document.getElementById("edit-categoria").value;
  if (stato) cat += "," + stato;

  const payload = {
    id:        _detailReview.id,
    titolo:    document.getElementById("edit-titolo").value.trim(),
    categoria: cat,
    rating:    parseFloat(document.getElementById("edit-rating").value) || 0,
    commento:  document.getElementById("edit-commento").value.trim(),
    metadata:  document.getElementById("edit-metadata").value.trim(),
    pros:      _collectPC("pros"),
    cons:      _collectPC("cons")
  };

  const btn = document.getElementById("detail-save-btn");
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = "…";

  try {
    const res = await apiPost("reviews_update", payload);
    if (res.status !== "SUCCESS") throw new Error(res.message || "Errore");
    closeDetail();
    refreshReviews();
  } catch(e) {
    console.error("saveEdit:", e);
    alert("Errore nel salvataggio: " + e.message);
  } finally {
    btn.textContent = orig;
    btn.disabled = false;
  }
}

async function regenerateReview() {
  if (!_detailReview) return;
  const btn = document.getElementById("detail-regen-btn");
  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await apiPost("reviews_regenerate", { id: _detailReview.id });
    if (res.status !== "SUCCESS") throw new Error(res.message || "Errore");
    closeDetail();
    refreshReviews();
  } catch(e) {
    console.error("regenerateReview:", e);
    alert("Rigenerazione non riuscita: " + e.message);
  } finally {
    btn.innerHTML = orig;
    btn.disabled = false;
    if (window.lucide) lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("detail-close-btn").addEventListener("click", closeDetail);

  document.getElementById("detail-modal").addEventListener("click", e => {
    if (e.target === document.getElementById("detail-modal")) closeDetail();
  });

  document.getElementById("detail-promote-btn").addEventListener("click", promoteReview);
  document.getElementById("detail-edit-btn").addEventListener("click", enterEditMode);
  document.getElementById("detail-cancel-btn").addEventListener("click", exitEditMode);
  document.getElementById("detail-save-btn").addEventListener("click", saveEdit);
  document.getElementById("detail-regen-btn").addEventListener("click", regenerateReview);

  document.querySelectorAll(".btn-pc-add").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      const list = document.getElementById(target === "pros" ? "edit-pros-list" : "edit-cons-list");
      list.appendChild(_pcRow("", target));
    });
  });
});
