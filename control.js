// ===============================================================
//  SNOWGAMES OVERLAY CONTROL.JS  v2.0
//  Struktur: Event, Wetter, Uhrzeit, Infotext
//  Alle Segmente unabhängig, sofortige Speicherung per updateStatePartial()
// ===============================================================

// === Hilfsfunktion: Teilzustände ins JSON schreiben ===
// === Hilfsfunktion: Nur betroffenen Teil ins JSON schreiben ===
async function updateStatePartial(changes) {
  console.log("🔄 updateStatePartial:", changes);
  try {
    const res = await fetch("state.json?t=" + Date.now());
    const state = res.ok ? await res.json() : {};

    // Nur betroffene Felder aktualisieren, ohne andere zu überschreiben
    if (changes.show) {
      state.show = { ...state.show, ...changes.show };
    }
    if (changes.event) {
      state.event = { ...state.event, ...changes.event };
    }
    if (changes.weather) {
      state.weather = { ...state.weather, ...changes.weather };
    }
    if (changes.schedule !== undefined) {
      state.schedule = changes.schedule;
    }

    if (changes.branding) {
      state.branding = { ...state.branding, ...changes.branding };
    }


    // Schreiben
    const response = await fetch("/cgi-bin/update.sh?file=state.json", {
      method: "POST",
      body: JSON.stringify(state, null, 2)
    });

    const txt = await response.text();
    if (txt.includes("OK")) console.log("✅ Aktualisiert:", changes);
    else console.warn("⚠️ Serverantwort:", txt);
  } catch (err) {
    console.error("❌ Update fehlgeschlagen:", err);
  }
}


// === Initial laden + Event-Listener registrieren ===
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Initialisierung gestartet…");

  try {
    const r = await fetch("state.json?t=" + Date.now());
    if (!r.ok) throw new Error("state.json nicht gefunden");
    const s = await r.json();

    // === EVENT ===
    document.getElementById("event_title").value = s.event?.title || "";
    document.getElementById("event_location").value = s.event?.location || "";
    document.getElementById("event_date").value = s.event?.date || "";
    const styleValue = s.event?.style || "normal";
    const sizeRadio = document.querySelector(`input[name="event_size"][value="${styleValue}"]`);
    if (sizeRadio) sizeRadio.checked = true;

    // === WETTER ===
    document.getElementById("weather_temp").value = s.weather?.temperature || "";
    document.getElementById("weather_wind").value = s.weather?.wind || "";
    document.getElementById("weather_vis").value = s.weather?.visibility || "";

    // === INFOTEXT ===
    document.getElementById("schedule_text").value = s.schedule || "";

    // === STATUS-INFO ===
    document.getElementById("result").innerText = "Daten geladen ✅";

    // =====================================================
    //  BUTTONS
    // =====================================================

    // === Event-Steuerung (3-Zustände) ===
    function getEventFields() {
      return {
        title: document.getElementById("event_title").value,
        location: document.getElementById("event_location").value,
        date: document.getElementById("event_date").value,
      };
    }

    document.getElementById("btn_event_large")?.addEventListener("click", () => {
      const data = {
        event: {
          ...getEventFields(),
          style: "normal"
        },
        show: { event: true }
      };
      updateStatePartial(data);
    });

    document.getElementById("btn_event_small")?.addEventListener("click", () => {
      const data = {
        event: {
          ...getEventFields(),
          style: "compact"
        },
        show: { event: false }
      };
      updateStatePartial(data);
    });

    document.getElementById("btn_event_off")?.addEventListener("click", () => {
      const data = {
        event: {
          ...getEventFields(),
          style: "normal"
        },
        show: { event: false }
      };
      updateStatePartial(data);
    });


    // === Wetter ===
    document.getElementById("btn_show_weather")?.addEventListener("click", () => {
      const data = {
        weather: {
          temperature: document.getElementById("weather_temp").value,
          wind: document.getElementById("weather_wind").value,
          visibility: document.getElementById("weather_vis").value
        },
        show: { weather: true }
      };
      updateStatePartial(data);
    });

    document.getElementById("btn_hide_weather")?.addEventListener("click", () => {
      updateStatePartial({ show: { weather: false } });
    });

    // === Infotext ===
    document.getElementById("btn_show_schedule")?.addEventListener("click", () => {
      const text = document.getElementById("schedule_text").value;
      updateStatePartial({ show: { schedule: true }, schedule: text });
    });

    document.getElementById("btn_hide_schedule")?.addEventListener("click", () => {
      updateStatePartial({ show: { schedule: false } });
    });

    // === Uhrzeit ===
    document.getElementById("btn_show_uhr")?.addEventListener("click", () => {
      updateStatePartial({ show: { uhr: true } });
    });

    document.getElementById("btn_hide_uhr")?.addEventListener("click", () => {
      updateStatePartial({ show: { uhr: false } });
    });
    // === Branding ===
    document.getElementById("btn_show_branding")?.addEventListener("click", () => {
      updateStatePartial({
        show: { branding: true },
        branding: { logo: "snowgames_logo.svg" }
      });
    });

    document.getElementById("btn_hide_branding")?.addEventListener("click", () => {
      updateStatePartial({
        show: { branding: false }
      });
    });

    console.log("✅ Steuerung vollständig initialisiert");
  } catch (err) {
    console.error("❌ Fehler beim Laden:", err);
    document.getElementById("result").innerText = "Fehler beim Laden ❌";
  }
});
