import React, { Component, useEffect } from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import Stack from './navigation/Stack';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import randomString from 'random-string';
import Toast from '@remobile/react-native-toast';

global.token_ = "";
global.code = "null";

export default class App extends Component {

  async set_chat() {
    const random_string = require('random-string')
    const x = randomString({ length: 6 });

    if (code == "null") { code = x.toLowerCase() }

    const set_chatt = {
      tts: " ",
      stt: "허브를 연동 시키세요",
      user_token: token_,
      hub_MAC: " "
    };
    const chatt = await firestore().collection("Live_translate").doc(code).set(set_chatt);
  }

  async saveTokenToDataBase(token) {
    const userId = auth().currentUser;
    await firestore()
      .collection('users')
      .doc('userId')
      .update({
        tokens: firestore.FieldValue.arrayUnion(token),
      });
    token_ = token
    this.set_chat()
  }

  useEffect() {
    messaging()
      .getToken()
      .then(token => {
        return this.saveTokenToDataBase(token);
      }).catch(e => {
        console.log(e)
      });
    return messaging().onTokenRefresh(token => {
      this.saveTokenToDataBase(token);
    });
  }

  render() {
    this.useEffect();
    return (
      <NavigationContainer>
        <Stack />
      </NavigationContainer>
    )
  }
}