import React, { Component } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Image, ScrollView, ImageBackground } from 'react-native';
import BluetoothSerial from "react-native-bluetooth-serial-next";
import Bluetooth from "./Bluetooth";
import Toast from '@remobile/react-native-toast';
import utf8 from 'utf8';
import { assemble } from 'hangul-js';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

global.nums = []
global.arr = []
global.text_to_jimunja = []
global.stt_tmp = ""
global.tts_set_ment = ""

export default class JimunjaChatt extends Component {

  state = {
    STT_ment: "",
    TTS_ment: "",
    tts_tmp: "",
    hub_MAC: "",
    user_token: ""
  }

  componentDidMount() {
    this.get_stt();
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
    if (this.state.STT_ment != "") {
      const Hangul = require('hangul-js');
      const array = this.state.STT_ment.split("")
      stt_tmp = Hangul.disassemble(array)
      this.stt_to_jimunja()
    }
  }

  async set_tts() {
    if (this.state.user_token == token_) {
      const document = await firestore().collection("Live_translate").doc(code).update({ tts: tts_set_ment });
    } else { Toast.showLongBottom("잘못된 접근 입니다. 앱을 재시작 해주세요.") }
  }

  // spacebar & backspace key
  buttonOperation(good) {
    if (good === 'Space') {
      this.setState({ tts_tmp: this.state.tts_tmp + " " })
    }
    else {
      let a = this.state.tts_tmp.split('')
      a.pop()
      this.setState({
        tts_tmp: a.join('')
      })
    }
  }

  // 키보드 클릭시 출력 값
  buttonPressed(text) { this.setState({ tts_tmp: this.state.tts_tmp + text }) }

  // send 버튼이벤트
  buttonEnter = async () => {
    this.get_stt()

    if (this.state.tts_tmp.length > 1) {
      const Hangul = require('hangul-js');
      const array = this.state.tts_tmp.split("")
      this.setState({ tts_tmp: " " })
      tts_set_ment = Hangul.assemble(array)
      if (this.state.hub_MAC == " ") {
        Toast.showLongBottom("허브를 연동시키세요.")
      } else {
        this.setState({ TTS_ment: Hangul.assemble(array) })
        this.set_tts()
      }
    } else { Toast.showShortBottom("대화를 입력하세요") }
  }

  // STT 메시지를 지문자로 번역
  stt_to_jimunja() {
    let dummy = []
    let t_to_j = []
    for (let i = 0; i < stt_tmp.length; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 10; k++) {
          if (stt_tmp[i] == nums[j][k]) {
            dummy.push(<Image style={{
              width: '11.5%',
              height: 60,
              margin: 2
            }} source={arr[j][k]} />)
          }
        }
      }
      if (dummy.length >= 8) {
        t_to_j.push(<View style={{ flexDirection: 'row', justifyContent: 'flex-start', flex: 1 }}>{dummy}</View>)
        dummy = []
      }
      if (stt_tmp.length - i <= 1) {
        t_to_j.push(<View style={{ flexDirection: 'row', justifyContent: 'flex-start', flex: 1 }}>{dummy}</View>)
        dummy = []
      }
    }
    text_to_jimunja = t_to_j
  }

  render() {
    const { navigation } = this.props;
    let rows = []
    nums = [['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅟ', 'ㅚ', 'ㅢ', 'ㅒ', 'ㅖ'], ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'], ['!', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'], [',', 'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', '.', '?']]
    // let keys = [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['blank', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['blank', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'blank', 'blank']]
    arr = [[require('../images/qq.png'), require('../images/ww.png'), require('../images/ee.png'), require('../images/rr.png'), require('../images/tt.png'), require('../images/nl.png'), require('../images/hl.png'), require('../images/ml.png'), require('../images/oo.png'), require('../images/pp.png')],
    [require('../images/q.png'), require('../images/w.png'), require('../images/e.png'), require('../images/r.png'), require('../images/t.png'), require('../images/y.png'), require('../images/u.png'), require('../images/i.png'), require('../images/o.png'), require('../images/p.png')],
    [require('../images/em.png'), require('../images/a.png'), require('../images/s.png'), require('../images/d.png'), require('../images/f.png'), require('../images/g.png'), require('../images/h.png'), require('../images/j.png'), require('../images/k.png'), require('../images/l.png')],
    [require('../images/sh.png'), require('../images/z.png'), require('../images/x.png'), require('../images/c.png'), require('../images/v.png'), require('../images/b.png'), require('../images/n.png'), require('../images/m.png'), require('../images/dot.png'), require('../images/mul.png')]]

    for (let i = 0; i < 4; i++) {
      let row = []
      for (let j = 0; j < 10; j++) {
        row.push(<TouchableOpacity onPress={() => {
          this.buttonPressed(nums[i][j])
          this.get_stt()
        }}>
          <Image style={styles.key_caps} source={arr[i][j]}></Image>
        </TouchableOpacity>)
      }
      rows.push(<View style={styles.keyboard_row}>{row}</View>)
    }

    let num_row = []
    let real_num = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
    let key_num = [require('../images/one.png'), require('../images/two.png'), require('../images/three.png'), require('../images/four.png'), require('../images/five.png'), require('../images/six.png'), require('../images/seven.png'), require('../images/eight.png'), require('../images/nine.png'), require('../images/zero.png')]

    for (let i = 0; i < 10; i++) {
      num_row.push(<TouchableOpacity onPress={() => {
        this.buttonPressed(real_num[i])
      }}>
        <Image style={styles.key_caps} source={key_num[i]}></Image>
      </TouchableOpacity>)
    }

    return (
      <View style={{ flex: 1 }}>
        {/* 말풍선 구현---------------------------------------------------------------------- */}
        <ScrollView style={{ flex: 1 }}>
          <View style={{ backgroundColor: '#3C929E' }}>
            <TouchableOpacity onPress={() => {
              this.stt_to_jimunja()
              this.props.navigation.navigate("지문자번역", { text_to_jimunja })
            }}>
              <ImageBackground style={styles.talk_baloon} source={require('../images/other_talk.png')}>
                <Text style={styles.speech_font}>{this.state.STT_ment}</Text>
              </ImageBackground>
            </TouchableOpacity>

            <View style={{ alignItems: 'flex-end' }}>
              <ImageBackground style={styles.talk_baloon} source={require('../images/my_talk.png')}>
                <Text style={styles.speech_font}>{this.state.TTS_ment}</Text>
              </ImageBackground>
            </View>
          </View>
        </ScrollView >

        {/* 입력 창 구현--------------------------------------------------------------------- */}
        < View style={styles.input_container} >
          <TextInput style={styles.textinput} editable={false} multiline={true}>
            {this.state.tts_tmp} </TextInput>
          < TouchableOpacity onPress={() => {
            if (this.state.hub_MAC != " ") { this.setState({ TTS_ment: this.state.tts_tmp }) }
            this.buttonEnter()
          }} style={styles.send_btn} >
            < Image style={{ width: '95%', height: '90%' }} source={require('../images/send.png')} />
          </TouchableOpacity>
        </View >

        {/* 키보드 구현---------------------------------------------------------------------- */}
        < View style={styles.keyboard} >
          <View style={styles.keyboard_row}>
            {num_row}
          </View>

          {rows[0]}{rows[1]}{rows[2]}{rows[3]}

          <View style={{ flexDirection: "row", flex: 1 }}>
            <TouchableOpacity style={{ flex: 1.5 }} onPress={() => {
              this.buttonOperation('Space')
              this.get_stt()
            }}>
              <Text style={styles.space}>Space</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 0.5 }} onPress={() => {
              this.buttonOperation('Del')
              this.get_stt()
            }}>
              <Text style={styles.del}>←</Text>
            </TouchableOpacity>
          </View>
        </View >
      </View >
    )
  }
}

const styles = StyleSheet.create({
  input_container: {
    flexDirection: "row",
    backgroundColor: '#3C929E',
    height: '10%'
  },
  textinput: {
    width: '85%',
    height: '75%',
    margin: 5,
    borderColor: 'gray',
    borderRadius: 10,
    backgroundColor: "white",
    color: 'black'
  },
  send_btn: {
    flex: 1,
    marginTop: 5,
    backgroundColor: '#3C929E',
  },
  keyboard: {
    flex: 1,
    backgroundColor: "gray",
  },
  keyboard_row: {
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1
  },
  key_caps: {
    width: '90%',
    height: '90%',
    margin: '5%'
  },
  space: {
    alignItems: 'center',
    paddingLeft: '40%',
    paddingTop: '5%',
    marginLeft: '3%',
    backgroundColor: "#DDDDDD",
    borderRadius: 5,
    width: '90%',
    height: '90%'
  },
  del: {
    borderRadius: 5,
    backgroundColor: "#A9A9A9",
    marginRight: 5,
    paddingLeft: '35%',
    paddingTop: '5%',
    fontSize: 25,
    height: '90%'
  },
  speech_font: {
    top: 5,
    left: 10,
    fontWeight: 'bold',
    fontSize: 15,
    paddingRight: 20
  },
  talk_baloon: {
    height: 165,
    width: 250,
    marginStart: 5,
    marginEnd: 5,
    marginTop: 5,
  },
})