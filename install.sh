#!/bin/bash
# ==========================================================
# Overlay-HTTP – Installationsskript v2 (Stand: November 2025)
# Unterstützt: Ubuntu, Debian, Raspberry Pi OS (alle aktuellen Versionen)
# Autor: Toralf Richter mit Hilfe von ChatGPT 5
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
