#!/usr/bin/env bash

# ----------------------------
# Si on n'est pas déjà dans un terminal interactif, on se relance dans un nouveau terminal
# ----------------------------
# On considère qu'on n'est pas dans un terminal si la sortie standard n'est pas un tty
if [ ! -t 1 ]; then
    SCRIPT_PATH="$(realpath "$0")"
    # Linux : gnome-terminal
    if command -v gnome-terminal >/dev/null; then
        gnome-terminal -- bash -c "\"$SCRIPT_PATH\"; exec bash"
        exit
    # Linux : konsole
    elif command -v konsole >/dev/null; then
        konsole --noclose -e bash -c "\"$SCRIPT_PATH\""
        exit
    # Linux : xterm
    elif command -v xterm >/dev/null; then
        xterm -hold -e "$SCRIPT_PATH"
        exit
    # macOS : Terminal.app
    elif command -v open >/dev/null; then
        open -a Terminal "$SCRIPT_PATH"
        exit
    else
        echo "Aucun émulateur de terminal graphique détecté. Exécute ce script depuis une console."
        exit 1
    fi
fi

# ----------------------------
# Là, on est bien dans un terminal interactif
# ----------------------------
# Lance le server Python en arrière-plan
python3 -m http.server &
SERVER_PID=$!

# Quand on ferme la fenêtre ou qu'on fait Ctrl+C, on tue proprement le serveur
trap 'kill $SERVER_PID 2>/dev/null' EXIT

# On attend un peu pour que le serveur démarre
sleep 1

# Ouvre l'URL dans le navigateur
URL="http://0.0.0.0:8000/"
if command -v xdg-open >/dev/null; then
    xdg-open "$URL"
elif command -v open >/dev/null; then
    open "$URL"
else
    echo "Ne peux pas ouvrir automatiquement le navigateur."
    echo "Va à : $URL"
fi

# On reste bloqué jusqu'à Ctrl+C ou fermeture de la fenêtre
wait $SERVER_PID

