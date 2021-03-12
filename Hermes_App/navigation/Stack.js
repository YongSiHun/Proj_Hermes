import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
import Home from "../screen/Home";
import Setting from "../screen/Setting";
import Sensor from "../screen/Sensor_name_edit";
import Bluetooth from "../screen/Bluetooth";
import JimunjaChatt from "../screen/JimunjaChatt";
import NormalChatt from "../screen/NormalChatt";
import SelectChatt from "../screen/SelectChatt";
import Sensor_wifi from "../screen/Sensor_wifi";
import stt_to_jimunja from "../screen/stt_to_jimunja";
import Alarm_screen from "../screen/alarm_screen";
import Sensor_name_edit from "../screen/Sensor_name_edit";

const Stack = createStackNavigator();

export default () => (
    <Stack.Navigator>
        <Stack.Screen options={{ headerTitleAlign: "center" }} name="홈화면" component={Home} />
        <Stack.Screen options={{ headerTitleAlign: "center" }} name="푸시알림" component={Alarm_screen} />
        <Stack.Screen options={{ headerTitleAlign: "center" }} name="실시간통역(한글)" component={NormalChatt} />
        <Stack.Screen options={{ headerTitleAlign: "center" }} name="실시간통역(지문자)" component={JimunjaChatt} />
        <Stack.Screen options={{ headerTitleAlign: "center" }} name="키보드선택" component={SelectChatt} />
        <Stack.Screen options={{ headerTitleAlign: "center" }} name="환경설정" component={Setting} />
        <Stack.Screen options={{ headerTitleAlign: "center" }} name="센서이름설정" component={Sensor_name_edit} />
        <Stack.Screen options={{ headerTitleAlign: "center" }} name="블루투스연결" component={Bluetooth} />
        <Stack.Screen options={{ headerTitleAlign: "center" }} name="센서와이파이" component={Sensor_wifi} />
        <Stack.Screen options={{ headerTitleAlign: "center" }} name="지문자번역" component={stt_to_jimunja} />
    </Stack.Navigator>
)