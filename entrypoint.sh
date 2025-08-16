#!/bin/sh
cd $1

PROJECT_NAME=$(jq -r '.name' package.json)

npm audit --json | node /opt/action-files/dist/main.js $PROJECT_NAME