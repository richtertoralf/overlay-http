# Overlay-HTTP – Web-Overlay für Livestreams

**Overlay-HTTP** ist ein ultraleichtes Overlay-System für Livestream-Produktionen.  
Es stellt Texte und Status-Infos als Browser-Quelle bereit, ideal für **GoStream Duet 8 ISO**, **OBS**, **vMix** oder andere Mischsysteme.

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
set -e
echo "==> Installing Overlay-HTTP..."

# Benutzer anlegen (falls nicht vorhanden)
if ! id overlay &>/dev/null; then
    echo "Creating system user 'overlay'..."
    sudo useradd -r -s /usr/sbin/nologin overlay
fi

# Zielverzeichnis
sudo mkdir -p /opt/overlay
sudo cp -r overlay/* /opt/overlay/
sudo chown -R overlay:overlay /opt/overlay

# systemd-Dienst installieren
sudo cp systemd/overlay-http.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now overlay-http.service

echo "==> Done."
echo "Server running on: http://$(hostname -I | awk '{print $1}'):8090"

```

## Vorraussetzungen
- Linux mit systemd (z. B. Debian, Ubuntu, Raspberry Pi OS)
- BusyBox (sudo apt install busybox)

## Lizenz
MIT License – frei verwendbar für Livestream-Produktionen.
