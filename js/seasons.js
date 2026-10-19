/* ============================================
   rank★d — Serie: stagioni e puntate · Fumetti: run e albi
   Puntata/albo = stelle + cuore + nota (salvate da sole, niente AI)
   Stagione = media puntate + recensione scritta (AI); serie = media stagioni
   Run a fumetti = un solo livello (stagione 1 sul backend): voto = media albi
   ============================================ */

let _seasonCtx = null;      // { review, season } della stagione aperta
const _epTimers = {};
// Cache di sessione: si scarica una volta, poi si aggiorna sul posto quando voti/scrivi
const _seriesCache = {};    // id serie → [stagioni]
const _seasonCache = {};    // "id:stagione" → { episodes, review }

function _fmtAvg(v) { return v > 0 ? v.toFixed(1).replace(".", ",") : "—"; }

/* ── Elenco stagioni nel dettaglio della serie ── */
async function loadSeasons(review) {
  const box  = document.getElementById("detail-seasons");
  const list = document.getElementById("detail-seasons-list");
  const cat  = getCleanCat(review);
  const game = cat === "GAME" && !isDlc(review);
  const show = (cat === "SERIE" || cat === "COMIC" || game) && !isWish(review);
  box.classList.toggle("hidden", !show);
  if (!show) return;
  document.getElementById("detail-seasons-label").textContent = cat === "COMIC" ? "Albi" : game ? "DLC" : "Stagioni";
  if (cat === "COMIC") return _loadIssues(review);
  if (game) return _renderDlcs(review);

  if (_seriesCache[review.id]) return _renderSeasons(review, _seriesCache[review.id]);

  list.innerHTML = '<div class="seasons-empty">Carico le stagioni…</div>';
  try {
    const res = await apiPost("series_get", { id: review.id });
    if (_detailReview !== review) return;            // nel frattempo è stato aperto altro
    if (res.status !== "SUCCESS") throw new Error(res.message || "errore");
    const seasons = res.seasons || [];
    if (!seasons.length) {
      // Non in cache: se correggi il titolo in Modifica, alla prossima apertura riprova TMDB
      list.innerHTML = `<div class="seasons-empty">${escapeHtml(res.message || "Nessuna stagione trovata")}</div>`;
      return;
    }
    _seriesCache[review.id] = seasons;
    _renderSeasons(review, seasons);
  } catch(e) {
    if (_detailReview === review) list.innerHTML = `<div class="seasons-empty">Stagioni non disponibili: ${escapeHtml(e.message)}</div>`;
  }
}

// Dopo una modifica del link: stagioni/albi di quella voce vanno riletti dal backend
function forgetSeries(id) {
  delete _seriesCache[id];
  Object.keys(_seasonCache).forEach(k => { if (k.indexOf(id + ":") === 0) delete _seasonCache[k]; });
}

/* ── Giochi: i DLC sono recensioni a parte, elencate qui (voto del gioco invariato) ── */
function _renderDlcs(game) {
  const list = document.getElementById("detail-seasons-list");
  const dlcs = _allReviews.filter(r => r.parent_id === game.id);
  list.innerHTML = dlcs.map(d => `
      <button type="button" class="season-row" data-id="${escapeHtml(d.id)}">
        <span class="season-main">
          <span class="season-name">${escapeHtml(d.titolo)}</span>
          <span class="season-sub">${escapeHtml(d.riassunto || "")}</span>
        </span>
        ${d.liked ? `<span class="liked-mark">${heartSvg()}</span>` : ""}
        <span class="season-rate stars">${renderStars(d.rating)}</span>
      </button>`).join("") +
    '<button type="button" class="btn-pc-add" id="dlc-add-btn">+ Aggiungi DLC</button>';
  list.querySelectorAll(".season-row").forEach(b => b.addEventListener("click", () =>
    openDetail(_allReviews.find(r => r.id === b.dataset.id))));
  document.getElementById("dlc-add-btn").addEventListener("click", () => { closeDetail(); openDlc(game); });
}

/* ── Fumetti: albi direttamente nel dettaglio della run ── */
async function _loadIssues(review) {
  const list = document.getElementById("detail-seasons-list");
  const key  = review.id + ":1";
  const show = data => {
    review._seriesRated = data.episodes.some(e => e.rating > 0);
    _renderEpisodes(data.episodes, list, { review, season: 1, eps: [], comic: true });
  };
  if (_seasonCache[key]) return show(_seasonCache[key]);

  list.innerHTML = '<div class="seasons-empty">Carico gli albi…</div>';
  try {
    const res = await apiPost("season_get", { id: review.id, season: 1 });
    if (_detailReview !== review) return;
    if (res.status !== "SUCCESS") throw new Error(res.message || "errore");
    if (!(res.episodes || []).length) {
      list.innerHTML = `<div class="seasons-empty">${escapeHtml(res.message || "Nessun albo trovato su ComicVine")}</div>`;
      return;
    }
    _seasonCache[key] = { episodes: res.episodes, review: null };
    show(_seasonCache[key]);
  } catch(e) {
    if (_detailReview === review) list.innerHTML = `<div class="seasons-empty">Albi non disponibili: ${escapeHtml(e.message)}</div>`;
  }
}

function _renderSeasons(review, seasons) {
  const list = document.getElementById("detail-seasons-list");
  review._seriesRated = seasons.some(s => s.avg > 0);
  list.innerHTML = seasons.map(s => `
      <button type="button" class="season-row" data-season="${s.season}">
        <span class="season-main">
          <span class="season-name">${escapeHtml(s.name || "Stagione " + s.season)}</span>
          <span class="season-sub">${s.rated}/${s.episode_count} puntate votate${s.reviewed ? " · recensita" : ""}</span>
        </span>
        <span class="season-rate stars">${renderStars(s.avg)}</span>
        <span class="season-avg">${_fmtAvg(s.avg)}</span>
      </button>`).join("");
  list.querySelectorAll(".season-row").forEach(b => b.addEventListener("click", () =>
    openSeason(review, parseInt(b.dataset.season, 10), b.querySelector(".season-name").textContent)));
}

/* ── Vista stagione ── */
async function openSeason(review, season, name) {
  _seasonCtx = { review, season, eps: [] };
  const ctx = _seasonCtx;
  document.getElementById("detail-view").classList.add("hidden");
  document.getElementById("detail-season").classList.remove("hidden");
  document.getElementById("season-back-label").textContent = review.titolo;
  document.getElementById("season-title").textContent = name;
  _setSeasonAvg(0);
  document.getElementById("season-review").innerHTML = "";
  document.getElementById("season-episodes").innerHTML = '<div class="seasons-empty">Carico le puntate…</div>';
  document.querySelector("#detail-modal .detail-body").scrollTop = 0;
  if (window.lucide) lucide.createIcons();

  const key = review.id + ":" + season;
  if (_seasonCache[key]) {
    _renderSeasonReview(_seasonCache[key].review);
    _renderEpisodes(_seasonCache[key].episodes, null, ctx);   // stessi oggetti che i voti modificano: la cache resta aggiornata
    return;
  }

  try {
    const res = await apiPost("season_get", { id: review.id, season });
    if (_seasonCtx !== ctx) return;
    if (res.status !== "SUCCESS") throw new Error(res.message || "errore");
    _seasonCache[key] = { episodes: res.episodes || [], review: res.review };
    _renderSeasonReview(res.review);
    _renderEpisodes(_seasonCache[key].episodes, null, ctx);
  } catch(e) {
    if (_seasonCtx === ctx) document.getElementById("season-episodes").innerHTML =
      `<div class="seasons-empty">Puntate non disponibili: ${escapeHtml(e.message)}</div>`;
  }
}

function closeSeason() {
  const ctx = _seasonCtx;
  _seasonCtx = null;
  // Riporta media e conteggi della stagione nell'elenco, senza richiederlo al backend
  const s = ctx && (_seriesCache[ctx.review.id] || []).find(x => x.season === ctx.season);
  if (s && ctx.eps.length) {
    s.avg   = _localAvg(ctx.eps);
    s.rated = ctx.eps.filter(e => e.rating > 0).length;
  }
  document.getElementById("detail-season").classList.add("hidden");
  document.getElementById("detail-view").classList.remove("hidden");
  if (_detailReview) loadSeasons(_detailReview);
}

function _setSeasonAvg(v) {
  document.getElementById("season-rating").innerHTML = renderStars(v);
  document.getElementById("season-avg").textContent = _fmtAvg(v);
}

/* ── Recensione scritta della stagione ── */
function _renderSeasonReview(rev) {
  const box = document.getElementById("season-review");
  let pros = [], cons = [];
  if (rev) {
    try { pros = JSON.parse(rev.pros || "[]"); } catch(e) {}
    try { cons = JSON.parse(rev.cons || "[]"); } catch(e) {}
  }
  const pcList = (label, items, cls) => items.length
    ? `<div class="${cls}"><div class="detail-pc-label">${label}</div><ul class="detail-pc-list">${items.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>`
    : "";
  box.innerHTML = rev
    ? `<div class="detail-commento">${escapeHtml(rev.commento)}</div>
       ${pros.length || cons.length ? `<div class="detail-pros-cons season-pc">${pcList("Pro", pros, "detail-pros")}${pcList("Contro", cons, "detail-cons")}</div>` : ""}
       <button type="button" class="btn-pc-add season-write-btn">Riscrivi</button>`
    : `<button type="button" class="btn-detail-action season-write-btn"><i data-lucide="pencil"></i> Scrivi la tua sulla stagione</button>`;
  box.querySelector(".season-write-btn").addEventListener("click", () => _seasonWriteForm(rev));
  if (window.lucide) lucide.createIcons({ nodes: [box] });
}

function _seasonWriteForm(rev) {
  const ctx = _seasonCtx;
  const box = document.getElementById("season-review");
  box.innerHTML = `
    <textarea class="edit-input edit-textarea" rows="5" placeholder="Com'era questa stagione?"></textarea>
    <div class="detail-actions">
      <button type="button" class="btn-detail-action btn-edit-cancel">Annulla</button>
      <button type="button" class="btn-detail-action btn-edit-save">Pubblica</button>
    </div>`;
  const ta = box.querySelector("textarea");
  ta.value = rev ? rev.raw_text : "";
  ta.focus();
  box.querySelector(".btn-edit-cancel").addEventListener("click", () => _renderSeasonReview(rev));
  const btn = box.querySelector(".btn-edit-save");
  btn.addEventListener("click", async () => {
    const text = ta.value.trim();
    if (!text) return;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';
    try {
      const res = await apiPost("season_review", { id: ctx.review.id, season: ctx.season, text });
      if (res.status !== "SUCCESS") throw new Error(res.message || "errore");
      const cached = _seasonCache[ctx.review.id + ":" + ctx.season];
      if (cached) cached.review = res.review;
      const s = (_seriesCache[ctx.review.id] || []).find(x => x.season === ctx.season);
      if (s) s.reviewed = true;
      if (_seasonCtx === ctx) _renderSeasonReview(res.review);
    } catch(e) {
      alert("Recensione della stagione non salvata: " + e.message);   // il testo resta nel box
      btn.disabled = false;
      btn.textContent = "Pubblica";
    }
  });
}

/* ── Puntate ── */
// box = dove disegnare (null = vista stagione); ctx.comic = albi di una run
function _renderEpisodes(eps, box, ctx) {
  box = box || document.getElementById("season-episodes");
  if (!eps.length) { box.innerHTML = '<div class="seasons-empty">Nessuna puntata su TMDB</div>'; return; }
  box.innerHTML = "";
  ctx.eps = eps;
  const unit = ctx.comic ? "albo" : "puntata";
  const notes = [];
  eps.forEach(ep => {
    const row = document.createElement("div");
    row.className = "ep-row";
    row.innerHTML = `
      <div class="ep-head">
        <span class="ep-num">${ctx.comic ? "#" : ""}${escapeHtml(ep.episode)}</span>
        <span class="ep-title">${escapeHtml(ep.title || (ctx.comic ? "Albo #" : "Puntata ") + ep.episode)}</span>
        <button type="button" class="ep-note-btn" aria-label="Nota, ${unit} ${escapeHtml(ep.episode)}"><i data-lucide="pencil"></i></button>
        <button type="button" class="heart-toggle ep-heart" aria-label="Preferito, ${unit} ${escapeHtml(ep.episode)}" aria-pressed="false"></button>
      </div>
      <div class="stars star-picker ep-stars" role="slider" tabindex="0"
           aria-label="Voto ${unit} ${escapeHtml(ep.episode)}" aria-valuemin="0" aria-valuemax="5"></div>
      <textarea class="edit-input ep-note${ep.note ? "" : " hidden"}" rows="1" maxlength="300" placeholder="Nota…"></textarea>`;
    box.appendChild(row);

    const save = () => _queueEpisodeSave(ctx, ep);
    initStarPicker(row.querySelector(".ep-stars"), v => { ep.rating = v; save(); }).set(ep.rating);
    initHeartToggle(row.querySelector(".ep-heart"), on => { ep.liked = on; save(); }).set(ep.liked);
    const note = row.querySelector(".ep-note");
    note.value = ep.note;
    note.addEventListener("input", () => _fitNote(note));
    note.addEventListener("change", () => { ep.note = note.value.trim(); save(); });
    row.querySelector(".ep-note-btn").addEventListener("click", () => { note.classList.remove("hidden"); _fitNote(note); note.focus(); });
    notes.push(note);
  });
  notes.forEach(_fitNote);   // dopo l'inserimento nel DOM, quando l'altezza è misurabile
  if (_seasonCtx === ctx) _setSeasonAvg(_localAvg(eps));
  if (window.lucide) lucide.createIcons({ nodes: [box] });
}

// La nota mostra sempre tutto il testo: l'altezza segue il contenuto
function _fitNote(ta) {
  ta.style.height = "auto";
  ta.style.height = ta.scrollHeight + 2 + "px";
}

// Stessa regola del backend: media delle puntate votate, a un decimale
function _localAvg(eps) {
  const v = eps.map(e => e.rating).filter(r => r > 0);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : 0;
}

// Aspetta che smetti di toccare quella puntata, poi salva una volta sola
function _queueEpisodeSave(ctx, ep) {
  if (_seasonCtx === ctx) _setSeasonAvg(_localAvg(ctx.eps));
  const key = ctx.review.id + ":" + ctx.season + ":" + ep.episode;
  clearTimeout(_epTimers[key]);
  _epTimers[key] = setTimeout(async () => {
    try {
      const res = await apiPost("episode_save", {
        id: ctx.review.id, season: ctx.season, episode: ep.episode,
        rating: ep.rating, liked: ep.liked, note: ep.note
      });
      if (res.status !== "SUCCESS") throw new Error(res.message || "errore");
      if (res.series_rating > 0) {
        ctx.review.rating = res.series_rating;
        ctx.review._seriesRated = true;
        if (_detailReview === ctx.review && !isProgress(ctx.review)) {   // "in corso" non mostra il voto
          const el = document.getElementById("detail-rating");
          el.innerHTML = renderStars(res.series_rating);
          el.classList.remove("hidden");
        }
      }
    } catch(e) {
      alert((ctx.comic ? "Albo #" : "Puntata ") + ep.episode + " non salvato: " + e.message);
    }
  }, 700);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("season-back-btn").addEventListener("click", closeSeason);
});
