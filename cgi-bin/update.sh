#!/bin/sh
# CGI-Skript: schreibt mehrzeilige Texte korrekt in Datei

# Den kompletten Body lesen (nicht nur bis zum ersten Zeilenumbruch)
BODY=$(cat)

FILE=$(echo "$QUERY_STRING" | cut -d= -f2)

case "$FILE" in
  text1.txt|text2.txt|text3.txt|text4.txt|text_mitte.txt|state.json)
    printf "%s" "$BODY" > /opt/overlay/"$FILE"
    ;;
  *)
    echo "Content-type: text/plain"
    echo ""
    echo "Ungueltige Datei"
    exit 1
    ;;
esac

echo "Content-type: text/plain"
echo ""
echo "OK"
