import React, { Component } from "react";
import { View, Image, StyleSheet, Text, Button } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

export default class SelectChatt extends React.Component {
    render() {
        const { navigation } = this.props;
        return (
            <View style={styles.container} >
                <View style={styles.Image_container}>
                    <TouchableOpacity onPress={() => this.props.navigation.navigate('실시간통역(지문자)', { dev_name })}>
                        <Image style={styles.button_style} source={require('../pic/Jimunja.jpg')}></Image>
                        <Text style={{ textAlign: "center", fontSize: 20 }}>지문자키보드</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { this.props.navigation.navigate("실시간통역(한글)", { dev_name }) }}>
                        <Image style={styles.button_style} source={require('../pic/Normal.jpg')}></Image>
                        <Text style={{ textAlign: "center", fontSize: 20 }}>일반키보드</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    Image_container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        justifyContent: "space-around",

    },
    button_style: {
        width: 280,
        height: 200,
        borderColor: "black",
        borderRadius: 25,
        borderWidth: 2,
    }
})

