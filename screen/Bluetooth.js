import React from "react";
import {
    Platform, ScrollView, Text, SafeAreaView, View, ActivityIndicator, Modal, RefreshControl, TouchableHighlight, StyleSheet, TouchableOpacity
} from "react-native";
import Toast from "@remobile/react-native-toast";
import BluetoothSerial, { requestEnable, withSubscription } from "react-native-bluetooth-serial-next";
import wifi from 'react-native-android-wifi';
import { Buffer } from "buffer";
import SelectChatt from "./SelectChatt";

global.Buffer = Buffer;
global.dev_name = "";
global.dev_mac = "";

const iconv = require("iconv-lite");
const Button = ({ title, onPress, style, textStyle }) => (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
        <Text style={[styles.buttonText, textStyle]}>{title.toUpperCase()}</Text>
    </TouchableOpacity>
);
type Props = {};

export class Bluetooth extends React.Component<Props> {
    constructor(props) {
        super(props);
        this.Bluetooth = null;
        this.state = {
            isEnabled: false,
            device: null,
            devices: [],
            scanning: false,
            processing: false,
            currentSSID: null,
        };
    }

    async componentDidMount() {
        this.Bluetooth = this.props.Bluetooth;
        // 비동기(다른 작업과 동시처리) 프로미스(비동기를 동기방식처럼)를 이용하여 BluetoothSerial 함수 작동 Enable, 블루투스 장치 리스트 콜백
        try {
            const [isEnabled, devices] = await Promise.all([
                BluetoothSerial.isEnabled(),
                BluetoothSerial.list()
            ]);

            // map 함수 : 파라미터로 전달된 값을 프로세싱하여 새로운 배열 생성
            this.setState({
                isEnabled,
                devices: devices.map(device => ({
                    ...device,
                    paired: true,
                    connected: false
                }))
            });
        } catch (e) {
            Toast.showShortBottom("오류발생");
        }

        // 블루투스로 기기 연결 성공 알림
        this.Bluetooth.on("connectionSuccess", ({ device }) => {
            if (device) {
                Toast.showShortBottom(`${device.name}와 연결 성공`);
                dev_name = device.name
                dev_mac = device.id
            }
        });

        // 블루투스로 기기 연결 실패 알림
        this.Bluetooth.on("connectionFailed", ({ device }) => {
            if (device) { Toast.showShortBottom(`${device.name}와 연결 실패. 다시 연결하세요.`); }
        });

        // 블루투스 연결 끊김 알림
        this.Bluetooth.on("connectionLost", ({ device }) => {
            if (device) {
                Toast.showShortBottom(`${device.name}와 연결 끊김. 다시 연결하세요.`);
            }
        });
    }

    // 비동기 방식으로 블루투스 응답 가능 상태로 전환
    requestEnable = async () => {
        try {
            await BluetoothSerial.requestEnable();
            this.setState({ isEnabled: true });
            Toast.showShortBottom("requestEnable");
        } catch (e) { Toast.showShortBottom("오류발생"); }
    };

    // 검색된 블루투스 기기 목록 표시
    listDevices = async () => {
        try {
            const list = await BluetoothSerial.list();
            // 디바이스를 찾으면 아이디를 추출해서 found에 대입
            this.setState(({ devices }) => ({
                devices: devices.map(device => {
                    const found = list.find(v => v.id === device.id);
                    // id를 통해 페어링하고 연결
                    if (found) {
                        return {
                            ...found,
                            paired: true,
                            connected: true
                        };
                    }
                    // 연결된 기기는 device라는 변수로 반환됨
                    return device;
                })
            }));
        } catch (e) {
            Toast.showShortBottom("오류발생");
        }
    };

    // 페어링이 되어있다면 페어링해제, 안되있으면 페어링 하는 이벤트 함수
    toggleDevicePairing = async ({ id, paired }) => {
        if (paired) { await this.unpairDevice(id); }
        else { await this.pairDevice(id); }
    };

    // toggleDevicePairing에서 실행. 디바이스를 페어링
    pairDevice = async id => {
        this.setState({ processing: true });
        try {
            const paired = await BluetoothSerial.pairDevice(id);
            if (paired) {
                Toast.showShortBottom(
                    `${paired.name}와 페어링 성공`
                );
                this.setState(({ devices, device }) => ({
                    processing: false,
                    device: {
                        ...device,
                        ...paired,
                        paired: true
                    },
                    devices: devices.map(v => {
                        if (v.id === paired.id) {
                            return {
                                ...v,
                                ...paired,
                                paired: true
                            };
                        }
                        return v;
                    })
                }));
            } else {
                Toast.showShortBottom(`<${id}> 와 페어링 실패`);
                this.setState({ processing: false });
            }
        } catch (e) {
            Toast.showShortBottom("오류 발생");
            this.setState({ processing: false });
        }
    };

    // toggleDevicePairing에서 실행. 디바이스 페어링 해제
    unpairDevice = async id => {
        this.setState({ processing: true });
        try {
            const unpaired = await BluetoothSerial.unpairDevice(id);
            if (unpaired) {
                Toast.showShortBottom(
                    ` ${unpaired.name} 페어링 해제 완료`
                );
                this.setState(({ devices, device }) => ({
                    processing: false,
                    device: {
                        ...device,
                        ...unpaired,
                        connected: false,
                        paired: false
                    },
                    devices: devices.map(v => {
                        if (v.id === unpaired.id) {
                            return {
                                ...v,
                                ...unpaired,
                                connected: false,
                                paired: false
                            };
                        }
                        return v;
                    })
                }));
            } else {
                Toast.showShortBottom(`<${id}> 페어링 해제 실패`);
                this.setState({ processing: false });
            }
        } catch (e) {
            Toast.showShortBottom("오류발생");
            this.setState({ processing: false });
        }
    };

    // 디바이스 연결 버튼
    toggleDeviceConnection = async ({ id, connected }) => {
        if (connected) { await this.disconnect(id); }
        else { await this.connect(id); }
    };

    // toggleDeviceConnection에서 실행, 디바이스 연결
    connect = async id => {
        this.setState({ processing: true });
        try {
            const connected = await BluetoothSerial.connect(id);
            if (connected) {
                Toast.showShortBottom(`${connected.name} 와 연결됨`);
                this.setState(({ devices, device }) => ({
                    processing: false,
                    device: {
                        ...device,
                        ...connected,
                        connected: true
                    },
                    devices: devices.map(v => {
                        if (v.id === connected.id) {
                            return {
                                ...v,
                                ...connected,
                                connected: true
                            };
                        }
                        return v;
                    })
                }));
            } else {
                Toast.showShortBottom(`<${id}> 와 연결 실패`);
                this.setState({ processing: false });
            }
        }
        catch (e) {
            Toast.showShortBottom("오류 발생");
            this.setState({ processing: false });
        }
    };

    // toggleDeviceConnection에서 실행, 디바이스 연결해제
    disconnect = async id => {
        this.setState({ processing: true });
        try {
            await BluetoothSerial.device(id).disconnect();
            this.setState(({ devices, device }) => ({
                processing: false,
                device: {
                    ...device,
                    connected: false
                },
                devices: devices.map(v => {
                    if (v.id === id) {
                        return {
                            ...v,
                            connected: false
                        };
                    }
                    return v;
                })
            }));
        } catch (e) {
            Toast.showShortBottom("오류발생");
            this.setState({ processing: false });
        }
    };

    // 모달 창 화면 (패킷 작성 및 보내기 화면)
    renderModal = (device, processing) => {
        const { navigation } = this.props;
        if (!device) return null;
        const { id, name, paired, connected } = device;
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={true}
                onRequestClose={() => { }}
            >
                {/* 선택한 디바이스가 Hub 혹은 Sensor 이거나 아닐때의 옵션 */}
                {device && device.name == "HermesHub" || device.name == "HermesSensor" ? (
                    <View style={styles.device_option}>
                        <Text style={{ fontSize: 18, fontWeight: "bold" }}>{name}</Text>
                        <Text style={{ fontSize: 14 }}>{`<${id}>`}</Text>
                        {processing && (
                            <ActivityIndicator
                                style={{ marginTop: 15 }}
                                size={Platform.OS === "ios" ? 1 : 60}
                            />
                        )}
                        {/*pair 버튼 */}
                        {!processing && (
                            <View style={{ marginTop: 20, width: "50%" }}>
                                {Platform.OS !== "ios" && (
                                    <Button
                                        title={paired ? "페어링 해제" : "페어링"}
                                        style={{ backgroundColor: "#22509d" }}
                                        textStyle={{ color: "#fff" }}
                                        onPress={() => this.toggleDevicePairing(device)}
                                    />
                                )}
                                {/* connect 버튼 */}
                                <Button
                                    title={connected ? "연결 해제" : "연결"}
                                    style={{ backgroundColor: "#22509d" }}
                                    textStyle={{ color: "#fff" }}
                                    onPress={() => { this.toggleDeviceConnection(device) }}
                                />
                                {/* 실시간 통역 버튼 */}
                                <Button
                                    title={device.name == "HermesHub" ? "실시간 통역"
                                        : device.name == "HermesSensor" ? "센서 와이파이 연결"
                                            : "none"}
                                    style={{ backgroundColor: "#22509d" }}
                                    textStyle={{ color: "#fff" }}
                                    onPress={() => {
                                        {
                                            device.name == "HermesHub" ? this.props.navigation.navigate("키보드선택", { dev_name })
                                                : device.name == "HermesSensor" ? this.props.navigation.navigate("센서와이파이")
                                                    : this.state({ device: null })
                                        }
                                        this.setState({ device: null })
                                        this.requestEnable();
                                    }}
                                />
                                {/* 닫기버튼 */}
                                <Button
                                    title="뒤로가기"
                                    onPress={() => this.setState({ device: null })} />
                            </View>
                        )}
                    </View>)
                    : (<View style={styles.device_option}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>지원하지 않는 기기 입니다</Text>
                        <Button
                            title="뒤로가기"
                            style={{ backgroundColor: "#22509d" }}
                            textStyle={{ color: "#fff" }}
                            onPress={() => this.setState({ device: null })} />
                    </View>)
                }
            </Modal>
        );
    };

    // 메인화면 (디바이스 리스트 표시)
    render() {
        const { isEnabled, device, devices, scanning, processing } = this.state;
        return (
            <ScrollView style={{ flex: 1 }}>
                < React.Fragment >
                    {this.renderModal(device, processing)}
                    < DeviceList
                        devices={devices}
                        onDevicePressed={device => this.setState({ device })}
                        onRefresh={this.listDevices}
                    />
                </React.Fragment>
            </ScrollView>
        );
    }
}


export class DeviceList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            refreshing: false
        };
    }

    onDevicePressed = device => () => {
        if (typeof this.props.onDevicePressed === "function") {
            this.props.onDevicePressed(device);
        }
    };

    onRefresh = async () => {
        if (typeof this.props.onRefresh === "function") {
            this.setState({ refreshing: true });
            await this.props.onRefresh();
            this.setState({ refreshing: false });
        }
    };

    render() {
        const { devices = [] } = this.props;
        const { refreshing } = this.state;

        return (
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} />}
            >
                <View style={styles.listContainer}>
                    {devices.map(device => (
                        <TouchableHighlight
                            underlayColor="#eee"
                            key={device.id}
                            style={styles.listItem}
                            onPress={this.onDevicePressed(device)}
                        >
                            <View style={{ flexDirection: "column" }}>
                                <View style={{ flexDirection: "row" }}>
                                    <Text style={[styles.listItemStatus, { backgroundColor: device.paired ? "green" : "gray" }]}>
                                        {device.paired ? "페어링 됨" : "페어링 필요"}
                                    </Text>
                                    <Text style={[styles.listItemStatus, { backgroundColor: device.connected ? "green" : "gray", marginLeft: 5 }]}>
                                        {device.connected ? "연결 됨" : "연결 필요"}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: "column" }}>
                                    <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                                        {device.name}
                                    </Text>
                                    <Text>{`<${device.id}>`}</Text>
                                </View>
                            </View>
                        </TouchableHighlight>
                    ))}
                </View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 0.9,
        backgroundColor: "#f5fcff"
    },
    listContainer: {
        borderColor: "#ccc",
        borderTopWidth: 0.5
    },
    listItem: {
        flex: 1,
        height: "auto",
        paddingHorizontal: 16,
        borderColor: "#ccc",
        borderBottomWidth: 0.5,
        justifyContent: "center",
        paddingTop: 15,
        paddingBottom: 15
    },
    listItemStatus: {
        paddingLeft: 5,
        paddingRight: 5,
        paddingTop: 2,
        paddingBottom: 2,
        fontWeight: "bold",
        fontSize: 12,
        color: "#fff"
    },
    button: {
        height: 36,
        margin: 5,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center"
    },
    buttonText: {
        color: "#22509d",
        fontWeight: "bold",
        fontSize: 14
    },
    device_option: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});

export default withSubscription({ subscriptionName: "Bluetooth" })(Bluetooth);