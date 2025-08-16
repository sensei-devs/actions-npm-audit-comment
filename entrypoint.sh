#!/bin/sh
cd $1

npm audit | node /opt/action-files/dist/main.js