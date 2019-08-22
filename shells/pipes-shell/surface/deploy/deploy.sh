#!/bin/sh
# target
mkdir dist
# sources
cp -f ../* dist/
# custom entry-point
cp -f ./source/surface.html dist/
# collate sources
echo packing...
npx webpack
echo done.

