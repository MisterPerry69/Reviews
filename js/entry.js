/* ============================================
   REEL — Entry modal
   ============================================ */

let _entryLiked = null, _entryStars = null;
let _entryPromote = null;   // voce wish/in corso da completare (null = nuova voce)

function _showEntry() {
  document.getElementById("entry-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("entry-textarea").focus(), 80);
}

function openEntry(prefill) {
  _entryPromote = null;
  const modal = document.getElementById("entry-modal");
  modal.style.removeProperty("--current-accent");
  document.getElementById("entry-title").textContent = "Nuova voce";
  document.getElementById("entry-rating-row").classList.add("hidden");
  document.getElementById("entry-textarea").placeholder = "Scrivi qui...";
  document.getElementById("entry-textarea").value = prefill || "";
  _entryLiked.set(false);
  _showEntry();
}

// Completa una voce wish/in corso: stesso box, con stelle, sulla STESSA riga del foglio
function openPromote(review) {
  _entryPromote = review;
  const modal = document.getElementById("entry-modal");
  const tok = CAT_TOKENS[getCleanCat(review)] || CAT_TOKENS.ALL;
  modal.style.setProperty("--current-accent", tok.accent);
  document.getElementById("entry-title").textContent = "Com'era " + review.titolo + "?";
  document.getElementById("entry-rating-row").classList.remove("hidden");
  document.getElementById("entry-textarea").placeholder = "Dì la tua…";
  document.getElementById("entry-textarea").value = "";
  _entryStars.set(0);
  _entryLiked.set(!!review.liked);
  _showEntry();
}

function closeEntry() {
  document.getElementById("entry-modal").classList.add("hidden");
  document.getElementById("entry-textarea").value = "";
  document.body.style.overflow = "";
  _entryPromote = null;
}

async function submitEntry() {
  const textarea = document.getElementById("entry-textarea");
  const text     = textarea.value.trim();
  if (!text) return;
  const liked   = _entryLiked.get();
  const promote = _entryPromote;
  const rating  = _entryStars.get();

  const btn  = document.getElementById("entry-submit-btn");
  btn.disabled = true;
  const origHTML = btn.innerHTML;
  btn.innerHTML = '<div class="spinner"></div>';

  closeEntry();

  // Mostra loading card ottimistica nella lista
  const loadingId = "loading-" + Date.now();
  const listEl    = document.getElementById("reviews-list");
  const loadCard  = document.createElement("div");
  loadCard.id        = loadingId;
  loadCard.className = "entry-loading-card";
  loadCard.innerHTML = '<div class="spinner"></div><div class="entry-loading-text">L\'AI sta analizzando la tua recensione…</div>';
  listEl.prepend(loadCard);

  try {
    const res = promote
      ? await apiPost("reviews_complete", { id: promote.id, text, rating, liked })
      : await apiPost("reviews_process", { text, liked });
    loadCard.remove();
    if (promote && res.status !== "SUCCESS") alert("Non sono riuscito a salvare: " + (res.message || "errore") + "\n\nIl testo era:\n" + text);

    if (res.status === "SUCCESS" && res.data) {
      const r = res.data;
      const newReview = {
        id:        "pending-" + Date.now(),
        data:      new Date().toISOString().slice(0, 10),
        titolo:    r.titolo    || "",
        categoria: r.categoria || "ALTRO",
        rating:    r.rating    || 0,
        commento:  r.commento || "",
        image_url: r.image_url || "",
        riassunto: r.commento_breve || "",
        metadata:  r.metadata  || "",
        pros:      JSON.stringify(r.pros || []),
        cons:      JSON.stringify(r.cons || [])
      };
      // Ricarica completa per avere l'ID reale dal Sheet
      setTimeout(() => refreshReviews(), 1500);
    } else {
      refreshReviews();
    }
  } catch(e) {
    console.error("submitEntry error:", e);
    loadCard.remove();
    refreshReviews();
  }

  btn.innerHTML = origHTML;
  btn.disabled  = false;
}

document.addEventListener("DOMContentLoaded", () => {
  _entryLiked = initHeartToggle(document.getElementById("entry-liked"));
  _entryStars = initStarPicker(document.getElementById("entry-rating"));
  document.querySelector(".entry-liked-label").addEventListener("click", () => document.getElementById("entry-liked").click());
  document.getElementById("entry-close-btn").addEventListener("click", closeEntry);
  document.getElementById("entry-cancel-btn").addEventListener("click", closeEntry);
  document.getElementById("entry-submit-btn").addEventListener("click", submitEntry);

  document.getElementById("entry-modal").addEventListener("click", e => {
    if (e.target === document.getElementById("entry-modal")) closeEntry();
  });

  document.getElementById("entry-textarea").addEventListener("keydown", e => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitEntry();
  });
});
