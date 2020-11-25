import React, { Component } from "react";
import { View, Text, Button, StyleSheet, Image } from "react-native";
import { Card, CardContent } from 'react-native-cards';
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";

export default ({ navigation }) => {
    return (
        <ScrollView>
            <Card>
                <TouchableOpacity
                    style={style.Button_style}
                    onPress={() => { navigation.navigate('블루투스연결') }}>
                    <Image style={style.image_style} source={require('../pic/setting_screen.png')}></Image>
                    <Text style={style.font_style}>블루투스 기기 연결</Text>
                </TouchableOpacity>
            </Card>
            <Card>
                <TouchableOpacity
                    style={style.Button_style}
                    onPress={() => { navigation.navigate('센서이름설정') }}>
                    <Image style={style.image_style} source={require('../pic/setting_screen.png')}></Image>
                    <Text style={style.font_style}>센서 이름 설정</Text>
                </TouchableOpacity>
            </Card>
            <Card>
                <TouchableOpacity
                    style={style.Button_style}
                    onPress={() => { navigation.navigate('키보드선택') }}>
                    <Image style={style.image_style} source={require('../pic/setting_screen.png')}></Image>
                    <Text style={style.font_style}>키보드 선택</Text>
                </TouchableOpacity>
            </Card>
        </ScrollView >
    );
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    Button_style: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 10,
        justifyContent: 'space-between'
    },
    font_style: {
        fontSize: 25,
        fontWeight: 'bold',
        color: "#FEB557",
    },
    image_style: {
        height: 35,
        width: 50,
    }
});