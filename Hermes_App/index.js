/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import Alarm_screen from './screen/alarm_screen.js';
import { name as appName } from './app.json';
global.alarm_bg = 0;

messaging().setBackgroundMessageHandler(async remoteMessage => {
    AppRegistry.registerComponent(appName, () => Alarm_screen);
    alarm_bg = 1;
});

AppRegistry.registerComponent(appName, () => App);