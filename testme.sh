#!/bin/bash

# chmod +x testme.sh
# Launch the app in Chrome
echo "Testing app..." && \
    FOLDER="$(git rev-parse --show-toplevel)" && \
    start chrome "$FOLDER/index.html" && \
    echo "App launched in Chrome browser!";
