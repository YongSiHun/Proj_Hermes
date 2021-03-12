#!/bin/bash
sudo ifconfig wlan0 up
sudo iwlist wlan0 scanning | grep "ESSID" > /home/pi/Hub/shell/wifi_list.txt