/* ============================================
   rank★d — Condividi: immagine 3:4 (si vede intera nell'anteprima di WhatsApp)
   con poster, titolo, voto, avatar (facoltativo, salvato sul dispositivo) e logo
   ============================================ */

const SHARE_W = 1086, SHARE_H = 1448;
const STAR_PATH  = "M12 2.4l2.96 6 6.62.96-4.79 4.67 1.13 6.59L12 17.5 6.08 20.62l1.13-6.59L2.42 9.36 9.04 8.4 12 2.4z";
const HEART_PATH = "M12 20.6s-7.6-4.7-9.4-9.4C1.3 7.9 3.5 4.4 7.1 4.4c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.6 0 5.8 3.5 4.5 6.8-1.8 4.7-9.4 9.4-9.4 9.4z";
const AVATAR_KEY = "rankd_avatar";
let _shareBlob = null, _shareName = "", _shareReview = null;

function _loadImg(src, cors) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Il canvas accetta solo immagini con CORS: se il sito del poster non lo permette, passa dal backend
async function _posterImage(url) {
  if (!url) return null;
  try { return await _loadImg(url, true); } catch(e) {}
  try {
    const res = await apiPost("image_proxy", { url });
    if (res.status === "SUCCESS") return await _loadImg(res.data_url, false);
  } catch(e) {}
  return null;
}

/* ── Avatar: niente utenti nell'app, quindi vive in localStorage su questo dispositivo ── */
function _getAvatar() {
  try { return localStorage.getItem(AVATAR_KEY); } catch(e) { return null; }
}

// Foto dalla galleria → quadrato 256px ritagliato al centro (piccolo abbastanza per localStorage)
async function _setAvatarFromFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await _loadImg(url, false);
    const side = Math.min(img.width, img.height);
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
    localStorage.setItem(AVATAR_KEY, c.toDataURL("image/jpeg", 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function _roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function _wrapLines(g, text, maxW, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach(w => {
    const test = line ? line + " " + w : w;
    if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  });
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    while (g.measureText(lines[maxLines - 1] + "…").width > maxW) lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1);
    lines[maxLines - 1] += "…";
  }
  return lines;
}

// Disegna una forma SVG 24×24 (stella/cuore) in (x, y) di lato size; fill = 0 vuota, 0.5 mezza, 1 piena
function _drawIcon(g, pathD, x, y, size, color, fill) {
  const p = new Path2D(pathD);
  g.save();
  g.translate(x, y);
  g.scale(size / 24, size / 24);
  if (fill > 0) {
    g.save();
    if (fill < 1) { g.beginPath(); g.rect(0, 0, 12, 24); g.clip(); }
    g.fillStyle = color;
    g.fill(p);
    g.restore();
  }
  if (fill < 1) {
    g.strokeStyle = color;
    g.globalAlpha = 0.45;
    g.lineWidth = 1.6;
    g.lineJoin = "round";
    g.stroke(p);
  }
  g.restore();
}

async function renderShareImage(r) {
  const c = document.createElement("canvas");
  c.width = SHARE_W; c.height = SHARE_H;
  const g = c.getContext("2d");
  const cat = getCleanCat(r);
  const tok = CAT_TOKENS[cat] || CAT_TOKENS.ALL;
  await Promise.all([document.fonts.load("600 64px Fredoka"), document.fonts.load("600 30px Outfit")]).catch(() => {});
  const avatarSrc = _getAvatar();
  const [img, logo, avatar] = await Promise.all([
    _posterImage(r.image_url),
    _loadImg("logo.png", false).catch(() => null),
    avatarSrc ? _loadImg(avatarSrc, false).catch(() => null) : null
  ]);

  // Sfondo: poster sfocato e scurito, sfuma nel colore scuro della categoria
  g.fillStyle = tok.deep;
  g.fillRect(0, 0, SHARE_W, SHARE_H);
  if (img) {
    const s = Math.max((SHARE_W + 200) / img.width, (SHARE_H + 200) / img.height);
    g.save();
    g.filter = "blur(50px) brightness(0.5) saturate(1.2)";
    g.drawImage(img, (SHARE_W - img.width * s) / 2, (SHARE_H - img.height * s) / 2, img.width * s, img.height * s);
    g.restore();
  }
  const grad = g.createLinearGradient(0, SHARE_H * 0.4, 0, SHARE_H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, tok.deep);
  g.fillStyle = grad;
  g.fillRect(0, 0, SHARE_W, SHARE_H);

  // Misure, per centrare il blocco in verticale
  const AV = avatar ? 112 : 0;                       // l'avatar sta a cavallo del bordo alto del poster
  let pw, ph;
  if (img) {
    const s = Math.min(900 / img.width, 760 / img.height);   // giochi orizzontali: interi, senza ritaglio
    pw = img.width * s; ph = img.height * s;
  } else { pw = 460; ph = 460; }
  g.font = "600 64px Fredoka";
  const titleLines = _wrapLines(g, r.titolo || "", 940, 2);
  const parent = isDlc(r) ? _allReviews.find(x => x.id === r.parent_id) : null;
  const year = (String(r.metadata || "").match(/\b(19|20)\d{2}\b/) || [""])[0];
  const kicker = (parent ? "DLC · " + parent.titolo : { FILM: "Film", SERIE: "Serie", GAME: "Videogioco", COMIC: "Fumetto" }[cat] || "")
               + (year && !parent ? " · " + year : "");
  const rated = !isWish(r) && !isProgress(r) && r.rating > 0;
  const logoH = 84, logoW = logo ? logo.width * logoH / logo.height : 0;
  const blockH = AV / 2 + ph + 44 + 34 + titleLines.length * 74 + 24 + 58 + 52 + logoH;
  let y = Math.max(40, (SHARE_H - blockH) / 2) + AV / 2;

  // Poster
  const px = (SHARE_W - pw) / 2;
  g.save();
  g.shadowColor = "rgba(0,0,0,0.55)"; g.shadowBlur = 60; g.shadowOffsetY = 24;
  _roundRect(g, px, y, pw, ph, 26); g.fillStyle = img ? "#000" : "rgba(255,255,255,0.08)"; g.fill();
  g.restore();
  g.save();
  _roundRect(g, px, y, pw, ph, 26); g.clip();
  if (img) g.drawImage(img, px, y, pw, ph);
  else {
    g.font = "220px serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(CAT_EMOJI[cat] || "🎭", SHARE_W / 2, y + ph / 2);
  }
  g.restore();

  // Avatar: cerchio con bordo, centrato sul bordo alto del poster
  if (avatar) {
    const cx = SHARE_W / 2, cy = y, rad = AV / 2;
    g.save();
    g.beginPath(); g.arc(cx, cy, rad + 6, 0, Math.PI * 2); g.fillStyle = tok.deep; g.fill();
    g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); g.clip();
    g.drawImage(avatar, cx - rad, cy - rad, AV, AV);
    g.restore();
  }
  y += ph + 44;

  // Categoria · anno
  g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.font = "600 30px Outfit";
  g.fillStyle = "rgba(255,255,255,0.6)";
  g.fillText(kicker.toUpperCase(), SHARE_W / 2, y + 28);
  y += 34;

  // Titolo
  g.font = "600 64px Fredoka";
  g.fillStyle = "#fff";
  titleLines.forEach(line => { y += 74; g.fillText(line, SHARE_W / 2, y); });
  y += 24;

  // Voto (o stato) + cuore
  if (rated) {
    const size = 58, gap = 10, heart = r.liked ? size + 22 : 0;
    let x = (SHARE_W - (5 * size + 4 * gap + heart)) / 2;
    for (let i = 1; i <= 5; i++) {
      _drawIcon(g, STAR_PATH, x, y, size, tok.accent, r.rating >= i ? 1 : r.rating >= i - 0.5 ? 0.5 : 0);
      x += size + gap;
    }
    if (r.liked) _drawIcon(g, HEART_PATH, x + 12, y + 3, size - 6, tok.accent, 1);
  } else {
    g.font = "600 40px Outfit";
    g.fillStyle = tok.accent;
    g.fillText(isWish(r) ? "In wishlist" : isProgress(r) ? "In corso" : "", SHARE_W / 2, y + 44);
  }
  y += 58 + 52;

  // Logo vero (logo.png); se manca, il nome in testo
  if (logo) g.drawImage(logo, (SHARE_W - logoW) / 2, y, logoW, logoH);
  else { g.font = "600 56px Fredoka"; g.fillStyle = "#fff6f6"; g.fillText("rank★d", SHARE_W / 2, y + 52); }

  return new Promise(resolve => c.toBlob(resolve, "image/jpeg", 0.92));
}

/* ── Anteprima + condivisione ── */
async function openShare(review) {
  _shareReview = review;
  const btn = document.getElementById("detail-share-btn");
  btn.disabled = true;
  try {
    _shareBlob = await renderShareImage(review);
    if (!_shareBlob) throw new Error("immagine non generata");
    _shareName = (review.titolo || "recensione").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-rankd.jpg";
    const prev = document.getElementById("share-preview");
    if (prev.src) URL.revokeObjectURL(prev.src);
    prev.src = URL.createObjectURL(_shareBlob);
    const file = new File([_shareBlob], _shareName, { type: "image/jpeg" });
    document.getElementById("share-go-btn").classList.toggle("hidden", !(navigator.canShare && navigator.canShare({ files: [file] })));
    const hasAvatar = !!_getAvatar();
    document.getElementById("share-avatar-btn").textContent = hasAvatar ? "Cambia avatar" : "+ Aggiungi avatar";
    document.getElementById("share-avatar-remove").classList.toggle("hidden", !hasAvatar);
    document.getElementById("share-modal").classList.remove("hidden");
  } catch(e) {
    alert("Non sono riuscito a creare l'immagine: " + e.message);
  } finally {
    btn.disabled = false;
  }
}

function closeShare() {
  document.getElementById("share-modal").classList.add("hidden");
}

// Nuovo tocco = nuova "attivazione utente": il browser permette di aprire il menu condivisione
async function shareGo() {
  const file = new File([_shareBlob], _shareName, { type: "image/jpeg" });
  try { await navigator.share({ files: [file] }); }
  catch(e) { if (e.name !== "AbortError") alert("Condivisione non riuscita: " + e.message); }
}

function shareSave() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(_shareBlob);
  a.download = _shareName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("detail-share-btn").addEventListener("click", () => { if (_detailReview) openShare(_detailReview); });
  document.getElementById("share-close-btn").addEventListener("click", closeShare);
  document.getElementById("share-go-btn").addEventListener("click", shareGo);
  document.getElementById("share-save-btn").addEventListener("click", shareSave);
  document.getElementById("share-modal").addEventListener("click", e => { if (e.target.id === "share-modal") closeShare(); });

  const fileInput = document.getElementById("share-avatar-file");
  document.getElementById("share-avatar-btn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    fileInput.value = "";
    if (!file) return;
    try { await _setAvatarFromFile(file); }
    catch(e) { return alert("Avatar non salvato: " + e.message); }
    if (_shareReview) openShare(_shareReview);   // rigenera con l'avatar
  });
  document.getElementById("share-avatar-remove").addEventListener("click", () => {
    try { localStorage.removeItem(AVATAR_KEY); } catch(e) {}
    if (_shareReview) openShare(_shareReview);
  });
});
