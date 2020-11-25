import React, { Component } from "react";
import { View, Image, StyleSheet, Text, TouchableOpacity, BackHandler } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import RNExitApp from 'react-native-exit-app';

export default class Alarm_screen extends React.Component {
    state = {
        sensor_name: "",
        sound: "",
    }

    // 데이터베이스로부터 센서이름, 고유아이디, 소리이름, led_checker
    async receive_from_server() {
        const document = await firestore().collection('Hertest').doc('Living_sound').get();
        const { sensor_name, sound, led_checker } = document.data();
        if (led_checker == 1 && sound != 'null') {
            this.setState({ sensor_name: sensor_name, sound: sound })
        }
    }

    // 데이터베이스로 led_checker만 0으로 변경한채로 전송
    async send_to_server() {
        const document = await firestore().collection('Hertest').doc('Living_sound').update({ led_checker: 0, sound: 'null' });
    }

    render() {
        this.receive_from_server()
        const { navigation } = this.props;
        return (
            < View style={styles.Container} >
                <Text style={styles.text_style}>{this.state.sensor_name}에서</Text>
                <Text style={styles.text_style}>{this.state.sound}소리 발생</Text>
                <Image style={styles.image_style} source={require('../pic/led.gif')}></Image>
                <TouchableOpacity style={styles.button_style_led} onPress={() => {
                    this.receive_from_server()
                    this.send_to_server()
                    if (alarm_bg == 1) {
                        alarm_bg = 0
                        setTimeout(() => {
                            RNExitApp.exitApp()
                        }, 1000)
                    } else {
                        this.props.navigation.navigate("홈화면")
                    }
                }}><Text style={styles.button_text}>확인(LED끄기)</Text>
                </TouchableOpacity>
            </View >
        );
    }
}

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 10,
        backgroundColor: '#F0E68C'
    },
    text_style: {
        fontWeight: 'bold',
        fontSize: 30,
    },
    image_style: {
        width: 200,
        height: 350,
        marginBottom: 15,
        marginTop: 5
    },
    button_style_led: {
        backgroundColor: '#81C147',
        padding: 10,
        paddingLeft: 50,
        paddingRight: 50
    },
    button_style_home: {
        backgroundColor: '#50BCDF',
        padding: 10,
        paddingLeft: 50,
        paddingRight: 50
    },
    button_text: {
        fontWeight: 'bold',
        fontSize: 25
    }
})