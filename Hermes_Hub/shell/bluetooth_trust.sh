#!/bin/bash
sudo bluetoothctl devices | cut -c 8-24 > /home/pi/Hub/shell/bluetooth_MAC.txt

