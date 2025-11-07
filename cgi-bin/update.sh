#!/bin/sh
# BusyBox-kompatibles CGI-Skript: schreibt Text oder JSON-Dateien

FILE=$(echo "$QUERY_STRING" | cut -d= -f2)
BODY=$(cat)

case "$FILE" in
  text1.txt|text2.txt|text3.txt|text4.txt|text_mitte.txt|state.json)
    printf "%s" "$BODY" > /opt/overlay/"$FILE"
    echo "Content-type: text/plain"
    echo ""
    echo "OK"
    ;;
  *)
    echo "Content-type: text/plain"
    echo ""
    echo "Ungueltige Datei"
    ;;
esac
