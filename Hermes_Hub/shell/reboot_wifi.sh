#!/bin/bash
sudo wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant.conf
sudo iw wlan0 link
sudo hciconfig hci0 piscan
sudo iw dev wlan0 set power_save off
sudo wpa_supplicant -c/etc/wpa_supplicant/wpa_supplicant.conf -iwlan0 -d
wpa_supplicant -c/etc/wpa_supplicant/wpa_supplicant.conf -iwlan0 -d
sudo amixer cset numid=1 150
sudo -i