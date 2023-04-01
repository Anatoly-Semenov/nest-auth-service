#!/bin/sh
cp -R /app_cache/node_modules /usr/src/app/
rm -rf /usr/src/app/dist
exec yarn start
