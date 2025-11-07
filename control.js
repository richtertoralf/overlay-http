// ========================================================================
//  SNOWGAMES.LIVE – CONTROL.JS v3.1 (Modernized Edition)
//  Compatible with control.html (2025-10-25)
//  Modern JS structure, reusable handlers, clean fetch & better UX
// ========================================================================

// ------------------------------------------------------------------------
//  SETTINGS
// ------------------------------------------------------------------------
const DEBUG = true;
const log = (...args) => DEBUG && console.log("[SG]", ...args);

// ------------------------------------------------------------------------
//  GLOBAL STATE
// ------------------------------------------------------------------------
let localState = null;
const statusElem = () => document.getElementById("result");

// ------------------------------------------------------------------------
//  HELPERS
// ------------------------------------------------------------------------
async function fetchState() {
  const res = await fetch("state.json?t=" + Date.now());
  if (!res.ok) throw new Error("state.json not found");
  return await res.json();
}

async function saveState(state) {
  const res = await fetch("/cgi-bin/update.sh?file=state.json", {
    method: "POST",
    body: JSON.stringify(state, null, 2)
  });
  return await res.text();
}

function handleError(err, context = "unknown") {
  console.error(`❌ [${context}]`, err);
  if (statusElem()) statusElem().innerText = `Error: ${context}`;
}

function deepMerge(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      target[k] = deepMerge(target[k] || {}, v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

async function updateStatePartial(changes) {
  try {
    if (!localState) localState = await fetchState();
    localState = deepMerge(localState, changes);
    const result = await saveState(localState);
    if (result.includes("OK")) {
      log("✅ State updated:", changes);
      if (statusElem()) statusElem().innerText = "Updated ✔️";
      updateButtonStatus(localState);
    } else {
      log("⚠️ Server response:", result);
      if (statusElem()) statusElem().innerText = "Warning ⚠️";
    }
  } catch (err) {
    handleError(err, "updateStatePartial");
  }
}

// Simple debounce (for live input updates)
function debounce(fn, delay = 800) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ------------------------------------------------------------------------
//  GENERIC SHOW/HIDE REGISTRATION
// ------------------------------------------------------------------------
function registerShowHide(section, options = {}) {
  const showBtn = document.getElementById(`btn_${section}_show`);
  const hideBtn = document.getElementById(`btn_${section}_hide`);

  showBtn?.addEventListener("click", () => {
    const data = options.data ? options.data() : {};
    updateStatePartial({
      [section]: data,
      show: { [section]: true }
    });
  });

  hideBtn?.addEventListener("click", () => {
    updateStatePartial({ show: { [section]: false } });
  });
}

// ======================================================================
//  STATUS-VISUALISIERUNG (welche Box ist sichtbar?)
// ======================================================================
// ======================================================================
//  STATUS-VISUALISIERUNG – kompakt & wartbar
// ======================================================================
function updateButtonStatus(state) {
  const buttons = {
    event: {
      big: document.getElementById("btn_event_show_big"),
      small: document.getElementById("btn_event_show_small")
    },
    weather: document.getElementById("btn_weather_show"),
    clock: document.getElementById("btn_clock_show"),
    caption: document.getElementById("btn_caption_show"),
    branding: document.getElementById("btn_branding_show"),
    schedule: document.getElementById("btn_schedule_show"),
    outro: document.getElementById("btn_outro_show"),
    sponsor_bug: document.getElementById("btn_sponsorbug_show"),
    sponsor_bar: document.getElementById("btn_sponsorbar_show")
  };

  // --- EVENT (2 Buttons, style-abhängig) -------------------------------
  if (state.show?.event) {
    const compact = state.event?.style === "compact";
    buttons.event.small?.classList.toggle("active", compact);
    buttons.event.big?.classList.toggle("active", !compact);
  } else {
    buttons.event.small?.classList.remove("active");
    buttons.event.big?.classList.remove("active");
  }

  // --- REST (1 Button je Modul) ---------------------------------------
  for (const [key, btn] of Object.entries(buttons)) {
    if (key === "event") continue; // bereits erledigt
    const active =
      state.show?.[key] ||            // normaler show-Status
      (key === "outro" && state.outro?.visible); // Fallback für Outro
    btn?.classList.toggle("active", !!active);
  }
}

// ------------------------------------------------------------------------
//  INITIALIZATION
// ------------------------------------------------------------------------
window.addEventListener("DOMContentLoaded", async () => {
  log("🚀 Initializing control panel…");
  try {
    localState = await fetchState();
    log("✅ state.json loaded:", localState);
  } catch (err) {
    handleError(err, "fetchState");
    localState = {};
  }

  const s = localState;

  // --- Fill form fields --------------------------------------------------
  const setVal = (id, val = "") => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  // EVENT
  setVal("event_title", s.event?.title);
  setVal("event_location", s.event?.location);
  setVal("event_date", s.event?.date);

  // WEATHER
  setVal("weather_temp", s.weather?.temperature);
  setVal("weather_wind", s.weather?.wind);
  setVal("weather_vis", s.weather?.visibility);

  // CAPTION
  setVal("caption_name", s.caption?.name);
  setVal("caption_role", s.caption?.role);

  // TEXTS
  setVal("schedule_text", s.schedule?.text);
  setVal("outro_text", s.outro?.text);

  if (statusElem()) statusElem().innerText = "Data loaded ✅";

  updateButtonStatus(s);

  // ----------------------------------------------------------------------
  //  REGISTER HANDLERS
  // ----------------------------------------------------------------------

  // EVENT (big / small / hide)
  const getEventFields = () => ({
    title: document.getElementById("event_title").value,
    location: document.getElementById("event_location").value,
    date: document.getElementById("event_date").value
  });

  document.getElementById("btn_event_show_big")?.addEventListener("click", () => {
    updateStatePartial({
      event: { ...getEventFields(), style: "normal" },
      show: { event: true }
    });
  });

  document.getElementById("btn_event_show_small")?.addEventListener("click", () => {
    updateStatePartial({
      event: { ...getEventFields(), style: "compact" },
      show: { event: true }
    });
  });

  document.getElementById("btn_event_hide")?.addEventListener("click", () => {
    updateStatePartial({ show: { event: false } });
  });

  // WEATHER
  registerShowHide("weather", {
    data: () => ({
      temperature: document.getElementById("weather_temp").value,
      wind: document.getElementById("weather_wind").value,
      visibility: document.getElementById("weather_vis").value
    })
  });

  // CAPTION
  registerShowHide("caption", {
    data: () => ({
      name: document.getElementById("caption_name").value.trim(),
      role: document.getElementById("caption_role").value.trim()
    })
  });

  // SCHEDULE / OUTRO (share same info box)
  document.getElementById("btn_schedule_show")?.addEventListener("click", () => {
    const text = document.getElementById("schedule_text").value;
    updateStatePartial({
      schedule: { text, visible: true },
      outro: { visible: false },
      show: { schedule: true }
    });
  });

  document.getElementById("btn_schedule_hide")?.addEventListener("click", () => {
    updateStatePartial({
      schedule: { visible: false },
      show: { schedule: false }
    });
  });

  document.getElementById("btn_outro_show")?.addEventListener("click", () => {
    const outroText = document.getElementById("outro_text").value;
    updateStatePartial({
      outro: { text: outroText, visible: true },
      schedule: { visible: false },
      show: { schedule: false }
    });
  });

  document.getElementById("btn_outro_hide")?.addEventListener("click", () => {
    updateStatePartial({ outro: { visible: false } });
  });

  // CLOCK
  registerShowHide("clock");

  // BRANDING
  registerShowHide("branding", {
    data: () => ({ logo: "snowgames_logo.svg" })
  });

  // SPONSOR BUG & BAR
  registerShowHide("sponsorbug");
  registerShowHide("sponsorbar");

  // ======================================================================
  //  LOCAL CLOCK DISPLAY IN CONTROL PANEL
  // ======================================================================
  const clockDisplay = document.getElementById("clock_display");

  function updateLocalClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    clockDisplay.textContent = `${hh}:${mm}:${ss}`;
  }

  if (clockDisplay) {
    updateLocalClock();                // Initial anzeigen
    setInterval(updateLocalClock, 1000); // Jede Sekunde aktualisieren
  }


  // ----------------------------------------------------------------------
  //  AUTO-SAVE (optional UX improvement)
  // ----------------------------------------------------------------------
  document.getElementById("schedule_text")?.addEventListener(
    "input",
    debounce(() => {
      updateStatePartial({
        schedule: { text: document.getElementById("schedule_text").value }
      });
    }, 1000)
  );

  log("✅ Control panel initialized successfully");
});
