import React, { Component, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, Image, TouchableOpacity, ImageBackground, NativeModules, KeyboardAvoidingView } from 'react-native';
import { Bluetooth } from "./Bluetooth";
import BluetoothSerial from "react-native-bluetooth-serial-next";
import Toast from '@remobile/react-native-toast';
import utf8 from 'utf8';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

global.tts_set_ment = "";

export default class NormalChatt extends React.Component {
    state = {
        STT_ment: "",
        TTS_ment: "",
        tts_tmp: "",
        hub_MAC: "",
        user_token: ""
    }

    componentDidMount() {
        this.get_stt();
        TTS_ment = ""
        this.props.navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#3C929E' }} onPress={() => { return alert(`코드명 : ${code}`); }}>
                    < Image style={{ width: 50, height: 60 }} source={require('../images/code_key.png')} />
                </TouchableOpacity>
            )
        });
    }

    async get_stt() {
        const document = await firestore().collection("Live_translate").doc(code).get();
        const { tts, stt, user_token, hub_MAC } = document.data();
        this.setState({ STT_ment: stt, hub_MAC: hub_MAC, user_token: user_token })
    }

    async set_tts() {
        if (this.state.user_token == token_) {
            const document = await firestore().collection("Live_translate").doc(code).update({ tts: tts_set_ment });
        } else { Toast.showLongBottom("잘못된 접근 입니다. 앱을 재시작 해주세요.") }
    }

    async buttonEnter() {
        if (this.state.tts_tmp.length > 1) {
            this.state.hub_MAC == " " ? (Toast.showLongBottom("허브를 연동시키세요.")) : (this.set_tts())
        } else { Toast.showShortBottom("대화를 입력하세요") }
        this.setState({ TTS_ment: this.state.tts_tmp })
        this.get_stt()
        this.setState({ tts_tmp: " " })
    }

    render() {
        return (
            < View style={styles.wrap} >
                <ScrollView >
                    <ImageBackground style={styles.talk_baloon} source={require('../images/other_talk.png')}>
                        <Text style={styles.speech_font}>{this.state.STT_ment}</Text>
                    </ImageBackground>

                    <View style={{ alignItems: 'flex-end' }}>
                        <ImageBackground style={styles.talk_baloon} source={require('../images/my_talk.png')}>
                            <Text style={styles.speech_font}>{this.state.TTS_ment}</Text>
                        </ImageBackground>
                    </View>
                </ScrollView >
                <View style={styles.bottom}>
                    <TextInput style={styles.textinput}
                        onChangeText={(text) => {
                            this.setState({ tts_tmp: text })
                            this.get_stt()
                        }}
                        multiline={true}
                    >{this.state.tts_tmp}</TextInput>

                    < TouchableOpacity style={styles.btn} onPress={() => {
                        tts_set_ment = this.state.tts_tmp;
                        this.buttonEnter()
                    }}>
                        < Image style={{ width: '95%', height: '90%' }} source={require('../images/send.png')} />
                    </TouchableOpacity>
                </View>
            </View >
        );
    }
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        backgroundColor: '#3C929E',
    },
    speech_font: {
        top: 5,
        left: 10,
        fontWeight: 'bold',
        fontSize: 15,
        paddingRight: 20
    },
    bottom: {
        flexDirection: "row",
        backgroundColor: '#3C929E',
        height: '10%',
        marginBottom: 5
    },
    textinput: {
        width: '85%',
        height: 30,
        margin: 5,
        paddingTop: -5,
        borderColor: 'gray',
        borderRadius: 10,
        backgroundColor: "white",
        color: 'black'
    },
    btn: {
        flex: 1,
        marginTop: 5,
        backgroundColor: '#3C929E',
    },
    talk_baloon: {
        height: 165,
        width: 240,
        marginStart: 5,
        marginEnd: 5,
        marginTop: 5
    },
});