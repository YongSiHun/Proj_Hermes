import React, { Component, useEffect } from "react";
import { View, Image, StyleSheet, Text, Button, PermissionsAndroid, Alert } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import Alarm_screen from '../screen/alarm_screen.js';

export default class Home extends React.Component {

    async getStatus() {
        const dbstatus = await Alarm_screen.collection("Hertest").get();
    }

    useEffect() {
        this.getStatus();
        const unsubcribe = messaging().onMessage(async remoteMessage => {
            const title1 = remoteMessage.notification.title;
            const { navigation } = this.props;
            Alert.alert('센서에서 소리를 감지했습니다');
            navigation.navigate('푸시알림');
        })
        return unsubcribe;
    }

    render() {
        const { navigation } = this.props;
        const defaultAppMessaging = firebase.messaging();
        this.useEffect();

        return (
            < View style={styles.container} >
                <View style={styles.main_logo_container}>
                    <Image style={styles.hermes_logo} source={require('../pic/mainview.png')}></Image>
                </View>
                <View style={styles.feature_btn_container}>
                    <TouchableOpacity onPress={() => navigation.navigate('키보드선택')}>
                        <Image style={styles.icon} source={require('../pic/translate.png')}></Image>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('환경설정')}>
                        <Image style={styles.icon} source={require('../pic/setting.png')}></Image>
                    </TouchableOpacity>
                </View>
            </View >
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white"
    },
    main_logo_container: {
        flex: 1,
        alignItems: "center"
    },
    feature_btn_container: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: 'center'
    },
    hermes_logo: {
        width: 300,
        height: 300,
    },
    icon: {
        width: 130,
        height: 170,
    }
})