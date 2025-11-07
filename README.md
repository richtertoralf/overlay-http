# Overlay-HTTP – Web-Overlay für Livestreams

**Overlay-HTTP** ist ein ultraleichtes Overlay-System für Livestream-Produktionen.  
Es stellt Texte und Status-Infos als Browser-Quelle bereit, ideal für **GoStream Duet 8 ISO**, **OBS**, **vMix** oder andere Mischsysteme.

<p align="center">
  <img src="Screenshot%202025-11-07%20115441.png" alt="Screenshot 1" width="45%" style="margin-right:5px;"/>
  <img src="Screenshot%202025-11-07%20115620.png" alt="Screenshot 2" width="45%"/>
</p>


---
> install.sh funktioniert noch nicht.  

## Funktionen

- Textanzeige an verschiedenen festen Positionen gemäß im CSS eingestelltem Design
- Hintergrund transparent oder halbtransparent (CSS)
- Steuerseite mit Textfeldern, Checkboxen und Status-Speicherung
- Automatische Aktualisierung der Anzeige jede Sekunde
- minimaler Webserver – **BusyBox httpd** (ca. 200 KB RAM)
- Start als **systemd-Dienst**, Port 8090

---

## Aufbau

```bash
# Entwurf
overlay-http/
├── install.sh → Installationsskript
├── systemd/overlay-http.service → systemd-Dienstdatei
└── overlay/ → Web-Inhalt (Anzeige + Steuerung)
   ├── index.html → Overlay-Anzeige (für Mischer)
   ├── control.html → Steuerseite (für Regie)
   ├── style.css → Layout, Farben, Transparenz
   ├── control.js, update.js → Logik für Steuerung / Anzeige
   ├── state.json → gemeinsamer Status (z. B. Sichtbarkeit)
   ├── text_*.txt → Textdateien für Positionen
   └── cgi-bin/ → Platz für spätere CGI-Skripte
```
```bash
# aktueller Stand 07.11.25:
tori@mediamtx18:/opt/overlay$ tree
.
├── cgi-bin
│   └── update.sh
├── control.html
├── control.js
├── index.html
├── state.json
├── static
│   ├── css
│   │   ├── control.css
│   │   └── snowgames-default.css
│   └── img
│       └── snowgames_logo.svg
└── update.js

5 directories, 9 files
```

---

## Installation

```bash
git clone https://github.com/richtertoralf/overlay-http.git
cd overlay-http
sudo ./install.sh
```
Das Skript legt:  
- den Benutzer overlay (falls noch nicht vorhanden) an
- kopiert den Ordner overlay/ nach /opt/overlay
- installiert den systemd-Dienst
- startet den Server auf Port 8090

Status prüfen:
```
sudo systemctl status overlay-http.service

```
## Aufruf
|Seite|	Zweck|	URL|
|--|--|--|
|Anzeige (Mischer) |	Overlay-Ansicht für Browserquelle	| http://<IP>:8090/index.html |
|Steuerung (Regie)| Texte / Status bearbeiten |	http://<IP>:8090/control.html |

### Beispiel im LAN
```
Overlay:   http://192.168.95.18:8090/index.html
Steuerung: http://192.168.95.18:8090/control.html

```
## systemd-Dienst
/etc/systemd/system/overlay-http.service
```ini
[Unit]
Description=BusyBox HTTP server for overlay control
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=overlay
Group=overlay
ExecStart=/usr/bin/busybox httpd -f -p 8090 -h /opt/overlay -c /opt/overlay/cgi-bin
Restart=always
RestartSec=5

WorkingDirectory=/opt/overlay
ReadWritePaths=/opt/overlay
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target

```

## install.sh
```bash
#!/bin/bash
# ==========================================================
# Overlay-HTTP – Installationsskript v2 (Stand: November 2025)
# Unterstützt: Ubuntu, Debian, Raspberry Pi OS (alle aktuellen Versionen)
# Autor: Toralf Richter
# ==========================================================

# === KONFIGURATION ========================================
INSTALL_DIR="/opt/overlay"
SERVICE_NAME="overlay-http"
PORT="8090"
USER="overlay"
GROUP="$USER"
REPO_URL="https://github.com/richtertoralf/overlay-http.git"
# ==========================================================

echo "=== Overlay-HTTP Installer v2 ==="

# --- Rootrechte prüfen ---
if [[ $EUID -ne 0 ]]; then
  echo "❌ Bitte als root oder mit sudo ausführen."
  exit 1
fi

# --- Distribution prüfen (robust & zukunftssicher) ---
. /etc/os-release
if [[ "$ID" =~ ^(ubuntu|debian|raspberrypi)$ ]]; then
  echo "✅ Unterstützte Distribution erkannt: ${PRETTY_NAME}"
else
  echo "⚠️  Warnung: Nicht getestete Distribution (${PRETTY_NAME}). Weiter mit Vorsicht..."
fi

# --- Abhängigkeiten installieren ---
echo "📦 Installiere benötigte Pakete..."
apt-get update -qq
apt-get install -y busybox git curl systemd > /dev/null || {
  echo "❌ Paketinstallation fehlgeschlagen."
  exit 1
}

# --- Benutzer anlegen, falls nicht vorhanden ---
if ! id "$USER" &>/dev/null; then
  echo "👤 Erstelle Systembenutzer '$USER'..."
  useradd -r -s /usr/sbin/nologin "$USER"
fi

# --- Zielverzeichnis vorbereiten ---
echo "📁 Richte Zielverzeichnis ein: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
chown -R "$USER:$GROUP" "$INSTALL_DIR"

# --- Repository klonen oder aktualisieren ---
if [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "🔄 Aktualisiere bestehende Installation..."
  cd "$INSTALL_DIR" && git pull -q
else
  echo "⬇️  Klone Repository..."
  git clone -q "$REPO_URL" "$INSTALL_DIR"
fi

# --- Dateistruktur prüfen ---
if [[ ! -d "$INSTALL_DIR/static" ]]; then
  echo "❌ Strukturfehler: 'static/'-Ordner fehlt. Bitte Repository prüfen!"
  exit 1
fi

# --- Systemd Service erstellen ---
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "⚙️  Erstelle systemd-Dienstdatei..."
cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Overlay-HTTP Webserver
After=network.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${INSTALL_DIR}
ExecStart=/bin/busybox httpd -f -p ${PORT} -h ${INSTALL_DIR}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# --- Berechtigungen & Aktivierung ---
chown root:root "$SERVICE_FILE"
chmod 644 "$SERVICE_FILE"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME" > /dev/null
systemctl restart "$SERVICE_NAME"

# --- Port prüfen ---
if ss -tuln 2>/dev/null | grep -q ":${PORT} "; then
  echo "✅ Port ${PORT} aktiv – BusyBox httpd läuft."
else
  echo "⚠️  Warnung: Port ${PORT} scheint nicht aktiv zu sein!"
fi

# --- IP-Adresse ausgeben ---
IP=$(hostname -I | awk '{print $1}')
echo
echo "🌐 Overlay-HTTP ist jetzt erreichbar:"
echo "   → Index:   http://${IP}:${PORT}/index.html"
echo "   → Control: http://${IP}:${PORT}/control.html"
echo
echo "📋 Dienststatus anzeigen: sudo systemctl status ${SERVICE_NAME}"
echo "🔄 Dienst neu starten:    sudo systemctl restart ${SERVICE_NAME}"
echo
echo "✅ Installation abgeschlossen."

```

## Vorraussetzungen
- Linux mit systemd (z. B. Debian, Ubuntu, Raspberry Pi OS)
- BusyBox (sudo apt install busybox)

## Lizenz
MIT License – frei verwendbar für Livestream-Produktionen.
