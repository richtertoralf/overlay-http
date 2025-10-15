let lastSecond = -1;

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  if (ss !== lastSecond) {
    const clock = document.getElementById("uhr");
    if (clock) clock.innerText = `${hh}:${mm}:${ss}`;
    lastSecond = ss;
  }
  requestAnimationFrame(updateClock);
}

function updateText(id, file) {
  return fetch(file + "?t=" + Date.now())
    .then(r => r.text())
    .then(t => {
      const el = document.getElementById(id);
      if (el) el.innerText = t.trim(); // kein display-Setzen mehr!
    })
    .catch(err => console.error("Fehler bei", file, err));
}

function updateVisibility(state) {
  if (!state) return;
  const elTitle = document.getElementById("text1");
  const elClock = document.getElementById("uhr");
  const elMitte = document.getElementById("text_mitte");
  if (elTitle) elTitle.style.display = state.showTitle ? "block" : "none";
  if (elClock) elClock.style.display = state.showClock ? "block" : "none";
  if (elMitte) elMitte.style.display = state.showMitte ? "block" : "none";
}

function refreshAll() {
  fetch("state.json?t=" + Date.now())
    .then(r => r.json())
    .then(state => {
      const files = [
        ["text1", "text1.txt"],
        ["text2", "text2.txt"],
        ["text3", "text3.txt"],
        ["text4", "text4.txt"],
        ["text_mitte", "text_mitte.txt"]
      ];
      return Promise.all(files.map(([id, file]) => updateText(id, file)))
        .then(() => updateVisibility(state));
    })
    .catch(() => {});
}

setInterval(refreshAll, 2000);
refreshAll();
updateClock();
