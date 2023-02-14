#!/bin/bash
cd poker/poker.engine
npm install
forever start --killSignal=SIGTERM build/poker.engine/src/app.js
