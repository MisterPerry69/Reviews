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

async function apiPost(action, payload) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ action }, payload || {})),
  });
  return _parse(res);
}
