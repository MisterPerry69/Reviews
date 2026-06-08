/* ============================================
   REEL — API layer
   ============================================ */

const GAS_URL = "YOUR_GAS_URL_HERE"; // sostituire dopo deploy GAS

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

async function apiPost(action, payload) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ action }, payload || {})),
  });
  return _parse(res);
}
