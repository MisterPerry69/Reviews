/* ============================================
   REEL — API layer
   ============================================ */

const GAS_URL = "https://script.google.com/macros/s/AKfycbxLmfIqVI0KxAu3WrAAToh_Bx_3v32FhHKf2NAbpmkYTkhvnFTP89uMBz4yTtOpMTvgCA/exec"; // sostituire dopo deploy GAS

async function _parse(res) {
  const txt = await res.text();
  if (txt.trim().startsWith("<")) {
    throw new Error("Il backend ha risposto con HTML invece di JSON. Verifica il deploy GAS.");
  }
  try {
    return JSON.parse(txt);
  } catch(e) {
    throw new Error("Risposta non JSON: " + txt.slice(0, 120));
  }
}

// Codice di accesso (APP_TOKEN sul backend): chiesto una volta, poi ricordato su questo dispositivo
const TOKEN_KEY = "rankd_token";
function _token() {
  let t = null;
  try { t = localStorage.getItem(TOKEN_KEY); } catch(e) {}
  if (!t) {
    t = (prompt("Codice di accesso") || "").trim();
    try { if (t) localStorage.setItem(TOKEN_KEY, t); } catch(e) {}
  }
  return t;
}

async function apiPost(action, payload) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ action, token: _token() }, payload || {})),
  });
  const data = await _parse(res);
  if (data.status === "UNAUTHORIZED") {
    try { localStorage.removeItem(TOKEN_KEY); } catch(e) {}
    throw new Error("Codice di accesso errato: ricarica l'app e reinseriscilo.");
  }
  return data;
}
