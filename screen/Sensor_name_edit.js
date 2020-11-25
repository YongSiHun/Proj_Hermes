import React, { Component } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Card, CardContent, CardAction } from 'react-native-cards';
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import Prompt from 'react-native-modal-prompt';
import Toast from "@remobile/react-native-toast";
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

type props = {};
global.name = "";

export default class Sensor_name_edit extends React.Component {

    componentDidMount() { this.receive_from_server(); }

    state = {
        promptVisible: false,
        display_name: ""
    }

    async receive_from_server() {
        const document = await firestore().collection("Hertest").doc("Living_sound").get();
        const { sensor_name, sound, sensor_uuid, led_checker } = document.data();
        this.setState({ sensor_name: sensor_name, sound: sound })
    }

    async send_to_server() {
        const document = await firestore().collection("Hertest").doc("Living_sound").update({ sensor_name: name });
    }

    render() {
        return (
            <ScrollView style={{ flex: 1 }}>
                <Card>
                    <TouchableOpacity style={style.Button_style}
                        onPress={() => { this.setState({ promptVisible: true }) }}>
                        <Text style={style.font_style}>센서이름 : {this.state.display_name}</Text>
                    </TouchableOpacity>
                </Card>
                <View>
                    <Prompt
                        title="센서 이름 설정"
                        placeholder="Start typing"
                        defaultValue={name}
                        visible={this.state.promptVisible}
                        operation={[
                            {
                                text: '설정',
                                onPress: (value) => {
                                    console.log(`the prompt value = `, value);
                                    name = value;
                                    this.setState({ display_name: value })
                                    this.send_to_server();
                                    Toast.showShortTop(`센서의 이름이' ${value}로 설정되었습니다.`);
                                    this.setState({ promptVisible: false })
                                }
                            },
                            {
                                text: 'Cancel',
                                color: '#000',
                                onPress: () => { this.setState({ promptVisible: false }) }
                            }
                        ]} />
                </View>
            </ScrollView >
        );
    }
}

const style = StyleSheet.create({
    Button_style: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 10,
        justifyContent: 'space-between'
    },
    font_style: {
        fontSize: 20,
        fontWeight: 'bold',
        color: "#000080",
    },
});