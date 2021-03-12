#!/bin/bash
apt-get update
apt-get dist-upgrade
apt install python-dev libsdl-image1.2-dev libsdl-mixer1.2-dev libsdl-ttf2.0-dev libsdl1.2-dev libsmpeg-dev subversion libportmidi-dev ffmpeg libswscale-dev libavformat-dev libavcodec-dev libssl-dev openssl libffi-dev
python3 -m pip install --upgrade pip
apt install bluetooth blueman bluez python3-bluetooth libbluetooth-dev libreadline-gplv2-dev libncursesw5-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev libbz2-dev fonts-unfonts-core 
pip3 install pybluez pybleno
apt install vim
apt install libsdl2-mixer-2.0-0
apt-get clean
python3 -m pip install --upgrade google-cloud pyaudio mutagen google pygame PyQt-builder PyQt5-sip
python3 -m pip install google-cloud-speech==1.3.2 firebase_admin
pip3 install "google-cloud-texttospeech<2.0.0"
apt install portaudio19-dev python3-pyqt5
apt install matchbox-keyboard
sudo amixer cset numid=1 150
git clone https://github.com/goodtft/LCD-show.git
cd LCD-show/
chmod +x LCD5-show
sudo ./LCD5-show