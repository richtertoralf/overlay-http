function saveText(file, textareaId) {
  const text = document.getElementById(textareaId).value;
  fetch('/cgi-bin/update.sh?file=' + file, {method:'POST', body:text})
    .then(r => r.text())
    .then(t => document.getElementById("result").innerText = "Gespeichert: " + file)
    .catch(e => alert("Fehler: " + e));
}

function saveState() {
  const state = {
    showTitle: document.getElementById("showTitle").checked,
    showClock: document.getElementById("showClock").checked,
    showMitte: document.getElementById("showMitte").checked
  };
  fetch('/cgi-bin/update.sh?file=state.json', {method:'POST', body:JSON.stringify(state)});
  document.getElementById("result").innerText = "Status aktualisiert.";
}

// Texte initial laden, damit beim Öffnen die aktuellen Inhalte angezeigt werden
window.onload = function() {
  fetch("text1.txt")
    .then(r => r.text())
    .then(t => document.getElementById("text_title").value = t.trim())
    .catch(()=>{});
  fetch("text_mitte.txt")
    .then(r => r.text())
    .then(t => document.getElementById("text_mitte").value = t.trim())
    .catch(()=>{});
};
