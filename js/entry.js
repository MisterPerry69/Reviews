/* ============================================
   REEL — Entry modal
   ============================================ */

function openEntry(prefill) {
  const modal    = document.getElementById("entry-modal");
  const textarea = document.getElementById("entry-textarea");
  textarea.value = prefill || "";
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  setTimeout(() => textarea.focus(), 80);
}

function closeEntry() {
  document.getElementById("entry-modal").classList.add("hidden");
  document.getElementById("entry-textarea").value = "";
  document.body.style.overflow = "";
}

async function submitEntry() {
  const textarea = document.getElementById("entry-textarea");
  const text     = textarea.value.trim();
  if (!text) return;

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
    const res = await apiPost("reviews_process", { text });
    loadCard.remove();

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
