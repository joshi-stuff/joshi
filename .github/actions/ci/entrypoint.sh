#!/bin/bash

echo ===========================================================================
echo = Install Node.js + npm
echo ===========================================================================
sudo pacman -S nodejs npm --noconfirm

echo ===========================================================================
echo = Setup machine environment for tests
echo ===========================================================================
sudo mknod -m 0660 /dev/loop0 b 7 8
sudo chown -R build:build /github/home
sudo chown -R build:build *

echo ===========================================================================
echo = Build project
echo ===========================================================================
cd src
make ci
