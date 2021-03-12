#!/bin/bash
sudo iw dev wlan0 set power_save off
sudo wpa_supplicant -c/etc/wpa_supplicant/wpa_supplicant.conf -iwlan0 -d
wpa_supplicant -c/etc/wpa_supplicant/wpa_supplicant.conf -iwlan0 -d
