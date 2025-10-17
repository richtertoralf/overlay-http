/* =========================================================================
   SNOWGAMES.LIVE – update.js
   Liest regelmäßig state.json und aktualisiert alle Overlays im Browser
   ========================================================================= */

/**
 * Zwischenspeicher des letzten gültigen Zustands,
 * falls state.json kurzzeitig leer oder fehlerhaft ist.
 */
let lastState = null;

/**
 * Ruft state.json ab und aktualisiert das Overlay.
 * Läuft alle 2 Sekunden (Intervall unten).
 */
async function updateOverlay() {
  try {
    const res = await fetch("state.json?t=" + Date.now());
    if (!res.ok) throw new Error("state.json nicht gefunden");

    const txt = await res.text();
    if (!txt.trim()) throw new Error("state.json leer");

    const state = JSON.parse(txt);
    lastState = state;
    applyState(state);
  } catch (err) {
    console.warn("⚠️ Overlay-Update-Fehler:", err.message);
    if (lastState) applyState(lastState); // Fallback auf letzten gültigen Zustand
  }
}

/* =========================================================================
   applyState(s)
   Liest das JSON-Objekt s und aktualisiert die sichtbaren Elemente
   ========================================================================= */
function applyState(s) {

  // === EVENT BOX =========================================================
  const eBox = document.getElementById("event_box");
  if (eBox) {
    const style = s.event?.style || "normal";

    // große oder kleine Variante unterscheiden
    if (style === "compact") {
      // Kompakte Variante bleibt IMMER sichtbar, auch wenn show.event = false
      eBox.className = "pos event_box compact visible";
      document.getElementById("event_title").innerText = s.event?.title || "";
      document.getElementById("event_location").innerText = s.event?.location || "";
      document.getElementById("event_date").innerText = s.event?.date || "";
    } else if (s.show?.event) {
      // Nur große Variante anzeigen, wenn show.event = true
      eBox.className = "pos event_box normal visible";
      document.getElementById("event_title").innerText = s.event?.title || "";
      document.getElementById("event_location").innerText = s.event?.location || "";
      document.getElementById("event_date").innerText = s.event?.date || "";
    } else {
      // Vollständig ausgeblendet
      eBox.className = "pos event_box normal";
    }
  }


  // === WEATHER BOX =======================================================
  const wBox = document.getElementById("weather_box");
  if (wBox) {
    if (s.show?.weather) {
      wBox.className = "pos weather_box visible";
      document.getElementById("weather_temp").innerText = s.weather?.temperature || "";
      document.getElementById("weather_wind").innerText = s.weather?.wind || "";
      document.getElementById("weather_vis").innerText = s.weather?.visibility || "";
    } else {
      wBox.className = "pos weather_box";
    }
  }

  // === SCHEDULE BOX ======================================================
  const schBox = document.getElementById("schedule_box");
  if (schBox) {
    if (s.show?.schedule) {
      schBox.className = "pos schedule_box visible";
      schBox.innerText = s.schedule || "";
    } else {
      schBox.className = "pos schedule_box";
    }
  }

  // === CLOCK / UHR =======================================================
  const uhr = document.getElementById("uhr");
  if (uhr) {
    if (s.show?.uhr) {
      uhr.className = "pos uhr visible";

      // Uhrzeit formatieren (HH:MM:SS)
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      uhr.innerText = `${hh}:${mm}:${ss}`;
    } else {
      uhr.className = "pos uhr";
    }
  }


  // === BRANDING BOX ======================================================
  const bBox = document.getElementById("branding_box");
  if (bBox) {
    if (s.show?.branding && s.branding?.logo) {
      bBox.className = "pos branding_box visible";
      bBox.innerHTML = `<img src="static/img/${s.branding.logo}" alt="Branding Logo" style="width:100%;height:auto;">`;
    } else {
      bBox.className = "pos branding_box";
      bBox.innerHTML = ""; // leeren, falls vorher sichtbar
    }
  }

}

  /* =========================================================================
     Starte periodisches Update jede Sekunde
     ========================================================================= */
  setInterval(updateOverlay, 1000);
  updateOverlay(); // Sofort initial ausführen
