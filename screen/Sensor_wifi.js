import React, { Component } from "react";
import { Alert, View, Text, Button, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Card, CardTitle, CardContent, CardAction, CardButton, CardImage } from 'react-native-cards';
import { ScrollView, TextInput, TouchableOpacity } from "react-native-gesture-handler";
import BluetoothSerial from "react-native-bluetooth-serial-next";
import Toast from "@remobile/react-native-toast";
import RnBgTask from 'react-native-bg-thread';
import utf8 from 'utf8';

global.tmp = "";
global.row = [];
global.send_index = "";
global.wifi_index = [];

export default class Sensor_wifi extends React.Component {

    state = {
        wifi_list: [],
        sw: 0,
        pw: "",
    }

    async componentDidMount() {
        try {
            await BluetoothSerial.write('scan')
            Toast.showShortBottom("센서와 연동 중 \r\n(와이파이 스캔 명령 전송완료)")
            setTimeout(async () => {
                var origin_data = await BluetoothSerial.readFromDevice();
                tmp = utf8.decode(origin_data);
                Toast.showShortBottom("와이파이 리스트 수신 완료")
                console.log(tmp)
                if (tmp == " ") {
                    alert("센서를 블루투스로 다시 연결하거나 공유기의 와이파이를 작동시켜주세요.")
                    alert("검색된 와이파이가 없습니다")
                }
                setTimeout(() => { this.separator() }, 1000)
            }, 5000)
        } catch (e) {
            console.log(e.message)
            Toast.showShortBottom("와이파이 목록 조회 실패, \r\nHermesSensor와 다시 블루투스 연결을 해주세요.")
        }
    }

    press_btn() {
        send_index = wifi_index[this.wifi_index]
        alert(send_index + "번 와이파이를 선택했습니다.")
    }

    separator() {
        let point = 0
        let list_num = 1
        for (let i = 0; i < tmp.length - 23; i++) {
            let row_tmp = []
            let k = 0
            if (tmp[i] == "\n") {
                i++
                for (let j = point; j < i; j++) {
                    row_tmp[k] = tmp[j]
                    k++
                }
                let row_joiner = row_tmp.join("")
                console.log("list_num = ", list_num, "point = ", point, "rowjoiner = ", row_joiner)
                wifi_index[list_num] = list_num
                row[list_num] = <TouchableOpacity
                    wifi_index={wifi_index[list_num]}
                    style={style.Button_style}
                    onPress={this.press_btn}>
                    <Text style={style.font_style}>{row_joiner}</Text>
                </TouchableOpacity >
                list_num++
                point = i
            }
        }
        this.setState({ wifi_list: row, sw: 1 })
    }

    async send_wifi_pw() {
        try {
            let send_pw = send_index + " " + this.state.pw
            console.log(send_pw)
            await BluetoothSerial.write(send_pw)
            Toast.showShortBottom("전송성공")
            this.setState({ pw: "" })
            send_index = ""
        } catch (e) {
            console.log(e.message)
            Toast.showShortBottom("전송실패. HermesSensor와 다시 연결해주세요.")
        }
    }

    render() {
        const sensor_mac = dev_mac
        console.log("sensor MAC Address = ", sensor_mac)
        return (
            <View style={style.container} >
                <ScrollView>
                    {this.state.sw == 0 ? <Text style={style.loading_font}>로딩중...</Text> :
                        <View>{this.state.wifi_list}</View>}
                </ScrollView >
                <View style={style.bottom}>
                    <TextInput
                        style={style.text_input}
                        onChangeText={(text) => this.setState({ pw: text })}
                        placeholder="  와이파이를 선택하고 비밀번호를 입력하세요"
                    >
                        {this.state.pw}
                    </TextInput>
                    < TouchableOpacity style={style.send_btn} onPress={() => { send_index == "" ? alert("연결할 와이파이를 선택하세요") : this.send_wifi_pw() }}>
                        < Image style={{ width: 40, height: 40 }} source={require('../images/send.png')} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

const style = StyleSheet.create({
    container: {
        flex: 1
    },
    Button_style: {
        borderWidth: 1,
        padding: 1,
        borderColor: "blue"
    },
    loading_font: {
        fontSize: 20,
        fontWeight: 'bold',
        color: "black",
        marginTop: 200,
        marginLeft: 150
    },
    font_style: {
        fontSize: 20,
        fontWeight: 'bold',
        color: "black",
        padding: 5,
        marginLeft: 15,
    },
    bottom: {
        backgroundColor: "gray",
        flexDirection: "row",
    },
    text_input: {
        flex: 7,
        width: 320,
        height: 50,
        backgroundColor: 'white',
    },
    send_btn: {
        flex: 1,
        backgroundColor: '#7030A0',
    },
});