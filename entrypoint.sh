#!/bin/sh
cd $1

npm audit --json | node /opt/action-files/dist/main.js