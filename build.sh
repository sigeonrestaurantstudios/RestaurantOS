#!/bin/sh
# Bundles src/ into a single self-contained RestaurantOS.html
cd "$(dirname "$0")"
JS="src/core1.js src/core2.js src/apps1.js src/apps2.js src/games.js src/v2.js src/apps3.js"
{ cat src/head.html; echo "<style>"; cat src/style.css src/v2.css; echo "</style>"; cat src/body.html; echo "<script>"; cat $JS; echo "</script>"; } > RestaurantOS.html
echo "Built RestaurantOS.html ($(wc -c < RestaurantOS.html) bytes)"
