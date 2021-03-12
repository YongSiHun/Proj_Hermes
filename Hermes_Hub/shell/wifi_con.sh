#!/bin/bash
sudo /etc/init.d/networking restart
sudo ifconfig wlan0 up
sudo cat /home/pi/Hub/shell/supplicant_maker.txt > /etc/wpa_supplicant/wpa_supplicant.conf
sudo wpa_passphrase $1 $2 >> /etc/wpa_supplicant/wpa_supplicant.conf
wpa_cli -i wlan0 reconfigure
sudo wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant.conf
sudo iw wlan0 link
sudo iw dev wlan0 set power_save off
sudo wpa_supplicant -c/etc/wpa_supplicant/wpa_supplicant.conf -iwlan0 -d
wpa_supplicant -c/etc/wpa_supplicant/wpa_supplicant.conf -iwlan0 -d