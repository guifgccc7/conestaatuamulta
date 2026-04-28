#!/bin/bash
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
export NODE_PATH="/usr/local/lib/node_modules"
cd /Users/Gui/Desktop/conestaatuamulta
exec /usr/local/Cellar/node/25.9.0/bin/node node_modules/.bin/next dev --port 3000
