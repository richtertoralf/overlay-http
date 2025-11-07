// ========================================================================
//  SNOWGAMES.LIVE – update.js v3
//  Overlay Runtime for index.html (2025-10-25)
//  Reads state.json every 2s, updates all overlay layers
// ========================================================================

// ------------------------------------------------------------------------
//  GLOBAL STATE
// ------------------------------------------------------------------------
let lastState = null;
let clockElem = null;

// ------------------------------------------------------------------------
//  MAIN UPDATE LOOP
// ------------------------------------------------------------------------
async function updateOverlay() {
  try {
    const res = await fetch("state.json?t=" + Date.now());
    if (!res.ok) throw new Error("state.json not found");

    const txt = await res.text();
    if (!txt.trim()) throw new Error("state.json empty");

    const state = JSON.parse(txt);
    lastState = state;
    applyState(state);
  } catch (err) {
    console.warn("⚠️ Overlay update error:", err.message);
    // fallback to last valid state
    if (lastState) applyState(lastState);
  }
}

// ------------------------------------------------------------------------
//  APPLY STATE – aktualisiert alle sichtbaren Overlays
// ------------------------------------------------------------------------
function applyState(s) {
  // === EVENT BOX =========================================================
  const eBox = document.getElementById("event_box");
  if (eBox) {
    const style = s.event?.style || "normal";
    const showEvent = !!s.show?.event;

    // Texte setzen
    document.getElementById("event_title").innerText = s.event?.title || "";
    document.getElementById("event_location").innerText = s.event?.location || "";
    document.getElementById("event_date").innerText = s.event?.date || "";

    eBox.classList.remove("normal", "compact", "visible");

    if (showEvent && style === "normal") {
      eBox.classList.add("normal", "visible");
    } else if (showEvent && style === "compact") {
      eBox.classList.add("compact", "visible");
    }
  }

  // === WEATHER BOX =======================================================
  const wBox = document.getElementById("weather_box");
  if (wBox) {
    if (s.show?.weather) {
      wBox.classList.add("visible");
      document.getElementById("weather_temp").innerText = s.weather?.temperature || "";
      document.getElementById("weather_wind").innerText = s.weather?.wind || "";
      document.getElementById("weather_vis").innerText = s.weather?.visibility || "";
    } else {
      wBox.classList.remove("visible");
    }
  }

  // === CAPTION / LOWER THIRD =============================================
  const cBox = document.getElementById("caption_box");
  if (cBox) {
    const show = !!s.show?.caption;
    const name = s.caption?.name?.trim() || "";
    const role = s.caption?.role?.trim() || "";

    document.getElementById("caption_name").textContent = name;
    document.getElementById("caption_role").textContent = role;

    if (show && (name || role)) cBox.classList.add("visible");
    else cBox.classList.remove("visible");
  }

  // === INFO BOX (Schedule / Outro – shared area) =========================
  const infoBox = document.getElementById("info_box");
  if (infoBox) {
    // Basis-Klassen immer sicherstellen
    infoBox.classList.add("pos", "info_box");

    if (s.outro?.visible) {
      // Outro aktiv
      infoBox.classList.add("visible");
      infoBox.innerText = s.outro?.text || "";
      infoBox.style.borderLeftColor = "var(--sg-yellow)";
    } else if (s.schedule?.visible || s.show?.schedule) {
      // Schedule aktiv
      infoBox.classList.add("visible");
      infoBox.innerText = s.schedule?.text || "";
      infoBox.style.borderLeftColor = "var(--sg-accent-blue)";

    } else {
      // Sanft ausblenden
      if (infoBox.classList.contains("visible")) {
        infoBox.classList.remove("visible");

        // Text erst nach der Transition löschen (600 ms)
        setTimeout(() => {
          infoBox.innerText = "";
        }, 600);
      }
    }
  }


  // === CLOCK BOX =========================================================
  clockElem = document.getElementById("clock_box");
  if (clockElem) {
    if (s.show?.clock) {
      clockElem.classList.add("visible");
      updateClock(); // sofort initialisieren
    } else {
      clockElem.classList.remove("visible");
    }
  }

  // === BRANDING BOX ======================================================
  const bBox = document.getElementById("branding_box");
  if (bBox) {
    if (s.show?.branding && s.branding?.logo) {
      bBox.classList.add("visible");
      bBox.innerHTML = `<img src="static/img/${s.branding.logo}" alt="Branding Logo">`;
    } else {
      bBox.classList.remove("visible");
      bBox.innerHTML = "";
    }
  }

  // === SPONSOR BUG =======================================================
  const bug = document.getElementById("sponsor_bug_box");
  if (bug) {
    if (s.show?.sponsor_bug) bug.classList.add("visible");
    else bug.classList.remove("visible");
  }

  // === SPONSOR BAR =======================================================
  const bar = document.getElementById("sponsor_bar_box");
  if (bar) {
    if (s.show?.sponsor_bar) bar.classList.add("visible");
    else bar.classList.remove("visible");
  }
}

// ------------------------------------------------------------------------
//  LOCAL CLOCK UPDATE (1s Interval)
// ------------------------------------------------------------------------
function updateClock() {
  if (!clockElem || !clockElem.classList.contains("visible")) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  clockElem.textContent = `${hh}:${mm}:${ss}`;
}

// ------------------------------------------------------------------------
//  INTERVAL CONTROL
// ------------------------------------------------------------------------
setInterval(updateOverlay, 1000); // state.json alle 2s
setInterval(updateClock, 900);   // lokale Uhr jede Sekunde
updateOverlay();                  // sofortiger Start
updateClock();                    // initialer Clock-Tick
