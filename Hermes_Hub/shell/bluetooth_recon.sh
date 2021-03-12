#!/bin/bash
sudo bluetoothctl pair $1
sudo bluetoothctl connect $1
sudo bluetoothctl trust $1