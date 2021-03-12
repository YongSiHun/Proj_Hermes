from __future__ import division
from google.cloud import speech, texttospeech
from google.cloud.speech import enums, types
from mutagen.mp3 import MP3
from threading import Thread
from six.moves import queue
from PyQt5 import uic, QtWidgets, QtCore
from PyQt5.QtCore import *
from PyQt5.QtGui import QPixmap, QIcon
import sys, os, pyaudio, time, subprocess, firebase_admin, pygame
from firebase_admin import credentials
from firebase_admin import firestore

cred = credentials.Certificate("/home/pi/Hub/input.json")
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/pi/Hub/input.json"

# 파이어베이스 초기화
firebase_admin.initialize_app(cred, {
    'projectId': "projid"
})

# HZ 단위의 샘플레이트. 마이크 설정에 맞게 값 설정 (for stt)
RATE = 48000
# 발음 단위. 샘플레이트/10. (for stt)
CHUNK = int(RATE / 10)

# 실시간 통역 화면 ui파일
chatting_ui = uic.loadUiType('/home/pi/Hub/ui/chatting.ui')[0]
hub_ui = uic.loadUiType('/home/pi/Hub/ui/hub.ui')[0]
wifi_ui = uic.loadUiType('/home/pi/Hub/ui/wifi.ui')[0]
code_ui = uic.loadUiType('/home/pi/Hub/ui/chat_key_input.ui')[0]

global Tran_Window, Main_Window, Wifi_Window, Code_Window, stt_client, tts_client, \
    gender, tts_ment, stt_ment, speech_Th, stream, doc_name, db, ment, tts_chk

tts_chk = 0
ment = ""
tts_ment = ""
stt_ment = ""
doc_name = ""
db = firestore.client()

# 마이크를 활성화 하여 음성을 수음하는 클래스
class MicrophoneStream(object):
    def __init__(self, rate, chunk):
        self._rate = rate
        self._chunk = chunk
        self._buff = queue.Queue()
        self.closed = True

    # pyaudio 라이브러리를 이용하여 오디오 스트림을 청취
    def __enter__(self):
        self._audio_interface = pyaudio.PyAudio()
        self._audio_stream = self._audio_interface.open(
            format=pyaudio.paInt16,
            channels=1, rate=self._rate,
            input=True, frames_per_buffer=self._chunk,
            stream_callback=self._fill_buffer,
        )
        self.closed = False
        return self

    # 소리가 더이상 들리지 않을때 마이크 스트림을 종료
    def __exit__(self):
        self._audio_stream.close()
        self.closed = True
        self._buff.put(None)
        self._audio_interface.terminate()

    # 버퍼에 수음한 청크 데이터를 저장. 음절을 끊는데 사용
    def _fill_buffer(self, in_data, frame_count, time_info, status_flags):
        self._buff.put(in_data)
        return None, pyaudio.paContinue

    # 클래스의 실질적인 마이크스트림 함수. 위에 선언된 함수들을 제어
    def generator(self):
        while not self.closed:
            chunk = self._buff.get()
            if chunk is None:
                return
            data = [chunk]
            while True:
                try:
                    chunk = self._buff.get(block=False)
                    if chunk is None:
                        return
                    data.append(chunk)
                except queue.Empty:
                    break
            yield b''.join(data)


# 음성인식 스레드 클래스
class Speech(Thread):
    def __init__(self):
        Thread.__init__(self)
        self.language_code = 'ko-KR'  # a BCP-47 language tag
        self._buff = queue.Queue()
        self.client = speech.SpeechClient()
        self.config = types.RecognitionConfig(
            encoding=enums.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=RATE,
            language_code=self.language_code)
        self.streaming_config = types.StreamingRecognitionConfig(
            config=self.config,
            interim_results=True)
        self.mic = None
        self.status = True
        self.daemon = True
        self.start()

    # 마이크 스트림 클래스 실행
    def run(self):
        global stream
        with MicrophoneStream(RATE, CHUNK) as stream:
            self.mic = stream
            audio_generator = stream.generator()
            requests = (types.StreamingRecognizeRequest(audio_content=content)
                        for content in audio_generator)
            responses = self.client.streaming_recognize(self.streaming_config, requests)
            self.listen_print_loop(responses, stream)
        self._buff.put(None)
        self.status = False

    def pauseMic(self):
        if self.mic is not None:
            self.mic.pause()

    def resumeMic(self):
        if self.mic is not None:
            self.mic.resume()

    def stopMic(self):
        self.mic.stop()

    def getText(self, block=True):
        return self._buff.get(block=block)

    # 음성인식 처리 루틴
    def listen_print_loop(self, responses, stream):
        num_chars_printed = 0
        try:
            for response in responses:
                if not response.results:
                    continue
                result = response.results[0]
                if not result.alternatives:
                    continue
                transcript = result.alternatives[0].transcript
                overwrite_chars = ' ' * (num_chars_printed - len(transcript))
                if not result.is_final:
                    sys.stdout.write(transcript + overwrite_chars + '\r')
                    sys.stdout.flush()
                    num_chars_printed = len(transcript)
                else:
                    self._buff.put(transcript+overwrite_chars)
                    num_chars_printed = 0
        except Exception as e:
            print("Speech Error = ", e)
            return


# Speech_to_text 메인클래스
class speech_to_text:
    def stt_main(self):
        global speech_Th, stt_ment
        speech_Th = Speech()
        # 음성이 들릴때까지 대기
        while True:
            stt_ment = speech_Th.getText()
            if stt_ment is None:
                break
            print(stt_ment)
            time.sleep(0.01)
            # 음성이 들리면 해당 음성을 출력 후 종료
            break
        return stt_ment


# TTS 기능
class text_to_speech:
    global gender, tts_ment

    def gender_select(self):
        if (gender == 1):
            voice = texttospeech.types.VoiceSelectionParams(language_code='Ko-KOR', name='ko-KR-Standard-D',
                                                            ssml_gender=texttospeech.enums.SsmlVoiceGender.MALE)
        elif (gender == 2):
            voice = texttospeech.types.VoiceSelectionParams(language_code='Ko-KOR', name='ko-KR-Standard-B',
                                                            ssml_gender=texttospeech.enums.SsmlVoiceGender.FEMALE)
        return voice

    # mp3파일 생성 함수 (response가 바로 오디오 정보)
    def write_file(self, filename, response):
        try:
            with open(filename, 'wb') as speak:
                speak.write(response.audio_content)
                print('Audio content written to file' + filename)
            return 1
        except Exception as e:
            print("write mp3 file error = ", e)
            return 0

    # 생성된 mp3파일을 재생
    def play_Speech(self, filename):
        pygame.mixer.init()
        pygame.mixer.music.load(filename)
        audio = MP3(filename)
        pygame.mixer.music.play()
        time.sleep(audio.info.length + 0.2)
        pygame.quit()
        print("play = ", filename)
        return

    # mp3파일을 생성하기전 파일이름과 오디오 정보를 전달하는 함수.
    # 파일이름에 0과 1을 번갈아가며 함수의 파일점유 오류를 해결
    def naming(self, response):
        chk = 0
        hub_load = "/home/pi/Hub/"
        filename = hub_load + "output" + str(chk) + ".mp3"
        if self.write_file(filename, response) == 0:
            chk = 1
            filename = hub_load + "output" + str(chk) + ".mp3"
            self.write_file(filename, response)
        self.play_Speech(filename)

    # 메인함수. naming함수를 가장 먼저 실행 (파일이름으로 인한 오류예방을 위함임)
    def tts_main(self):
        global tts_chk
        if tts_chk == 1:
            client = texttospeech.TextToSpeechClient()
            voice = self.gender_select()
            input_text = texttospeech.types.SynthesisInput(text=tts_ment + "")
            audio_config = texttospeech.types.AudioConfig(audio_encoding=texttospeech.enums.AudioEncoding.MP3,
                                                          volume_gain_db=16.0, speaking_rate=0.85,
                                                          sample_rate_hertz=24000)
            response = client.synthesize_speech(input_text, voice, audio_config)
            self.naming(response)
        else:
            return


# STT 버튼 클릭시 스레드 실행
class STT_Thread(QtCore.QThread):

    def __init__(self, parent):
        super().__init__(parent)

    def run(self):
        global db
        Tran_Window.STT_btn.setEnabled(False)
        Tran_Window.STT_stop_btn.setEnabled(True)
        prt = stt_client.stt_main()
        ref = db.collection(u'Live_translate').document(doc_name)
        ref.update({u'stt': prt})
        if len(prt) >= 17:
            m = 0
            n = 17
            out_prt = ""
            while n <= len(prt):
                out_prt += prt[m:n] + '\n'
                m += 17
                n += 17
                if n > len(prt):
                    out_prt += prt[m:]
            Tran_Window.STT_lbl.setText(out_prt)
        else:
            Tran_Window.STT_lbl.setText(prt)
        Tran_Window.STT_btn.setEnabled(True)
        Tran_Window.STT_stop_btn.setEnabled(False)


# TTS 스레드
class TTS_Thread(QtCore.QThread):
    def __init__(self, parent):
        super().__init__(parent)

    def run(self):
        global tts_ment, ment, tts_chk, db
        while True:
            if doc_name != "":
                try:
                    mac_input = db.collection(u'Live_translate').document(doc_name)
                    mac_input.update({u'hub_MAC': "HermesHub"})
                    ref = db.collection(u'Live_translate').document(doc_name).get().to_dict()
                    data = str(ref)
                    for i in range(0, len(data), 1):
                        if data[i] == 't' and data[i + 1] == 't' and data[i + 2] == 's':
                            for j in range(i + 7, len(data), 1):
                                if data[j] != "'":
                                    ment += data[j]
                                else:
                                    break
                    if ment != tts_ment:
                        tts_chk = 1
                    else:
                        tts_chk = 0
                    tts_ment = ment
                    ment = ""
                    if len(tts_ment) >= 17:
                        m = 0
                        n = 17
                        display_prt = ""
                        while n <= len(tts_ment):
                            display_prt += tts_ment[m:n] + '\n'
                            m += 17
                            n += 17
                            if n > len(tts_ment):
                                display_prt += tts_ment[m:]
                        Tran_Window.TTS_lbl.setText(display_prt)
                    elif len(tts_ment) < 17:
                        Tran_Window.TTS_lbl.setText(tts_ment)
                    tts_client.tts_main()
                except Exception as e:
                    print("error = ", e)


# 실시간 통역 화면창 클래스
class Translate_Window(QtWidgets.QWidget, chatting_ui):
    def __init__(self):
        global gender
        gender = 1
        super().__init__()
        self.setupUi(self)
        self.setWindowTitle("Live Translate")
        self.setGeometry(0, 65, 795, 415)
        self.STT_btn.clicked.connect(self.stt_record)
        self.STT_stop_btn.clicked.connect(self.stt_stop)
        self.exit_btn.clicked.connect(self.back)
        self.gender_male.setChecked(True)
        self.gender_male.clicked.connect(self.gender_select)
        self.gender_female.clicked.connect(self.gender_select)
        self.get_tts()
        self.STT_stop_btn.setEnabled(False)
        self.STT_lbl_hide.setPixmap(QPixmap("/home/pi/Hub/icon/my_talk.png"))
        self.TTS_lbl_hide.setPixmap(QPixmap("/home/pi/Hub/icon/other_talk.png"))
        self.STT_btn.setIcon(QIcon('/home/pi/Hub/icon/mic.png'))
        self.STT_stop_btn.setIcon(QIcon('/home/pi/Hub/icon/mic_stop.png'))
        self.exit_btn.setIcon(QIcon("/home/pi/Hub/icon/exit.png"))

    def stt_record(self):
        global stt_t
        stt_t = STT_Thread(self)
        stt_t.start()

    def stt_stop(self):
        global stream
        stream.__exit__()

    def back(self):
        self.hide()
        self.STT_lbl.setText("")
        self.TTS_lbl.setText("")
        self.STT_btn.setEnabled(True)
        self.STT_stop_btn.setEnabled(False)
        Main_Window.show()

    def gender_select(self):
        global gender
        if self.gender_male.isChecked():
            gender = 1
        elif self.gender_female.isChecked():
            gender = 2

    def get_tts(self):
        tts_t = TTS_Thread(self)
        tts_t.start()


# 코드키 입력 클래스
class Codekey_Window(QtWidgets.QWidget, code_ui):
    def __init__(self):
        super().__init__()
        self.setupUi(self)
        self.setWindowTitle("codeKey_input")
        self.setGeometry(0, 65, 795, 210)
        self.connect_btn.clicked.connect(self.translate)
        self.exit_btn.clicked.connect(self.back)
        self.guide_img.setPixmap(QPixmap("/home/pi/Hub/icon/guide_img.png"))
        self.connect_btn.setIcon(QIcon("/home/pi/Hub/icon/connect.png"))
        self.exit_btn.setIcon(QIcon("/home/pi/Hub/icon/exit.png"))

    def translate(self):
        global doc_name, db
        doc_name = str(self.key_input.toPlainText())
        try:
            id_list = []
            db = firestore.client()
            ref_ = db.collection(u'Live_translate').stream()
            for doc in ref_:
                id_list.append(doc.id)
            for i in range(0, len(id_list), 1):
                if doc_name == id_list[i]:
                    subprocess.call(['sudo', 'killall', 'matchbox-keyboa'])
                    self.hide()
                    Tran_Window.show()
                if i >= len(id_list) and doc_name != id_list[i]:
                    self.err_lbl.setText("코드가 틀립니다.\n코드를 다시 입력해주세요")
        except Exception as e:
            print("코드키 오류 = ", e)
        self.key_input.clear()

    def back(self):
        subprocess.call(['sudo', 'killall', 'matchbox-keyboa'])
        self.key_input.clear()
        self.hide()
        Main_Window.show()


# 와이파이 검색 스레드
class wifi_scan_Thread(QtCore.QThread):
    def __int__(self, parent):
        super().__init__(parent)

    def run(self):
        Wifi_Window.wifi_list_widget.clear()
        Wifi_Window.scan_btn.setEnabled(False)
        subprocess.call(['sudo', 'bash', '/home/pi/Hub/shell/wifi_list_create.sh'])
        file = open('/home/pi/Hub/shell/wifi_list.txt', 'r', encoding='UTF-8')
        lines = file.readlines()
        for wifi_SSID in lines:
            Wifi_Window.wifi_list_widget.addItem(wifi_SSID)
        file.close()
        Wifi_Window.scan_btn.setEnabled(True)


# 가상터치키보드 표시
class keyboard_setup(QtCore.QThread):
    def __init__(self, parent):
        super().__init__(parent)

    def run(self):
        subprocess.call(['sudo', 'matchbox-keyboard'])


# 허브 와이파이 연결 화면
class Wifi_Con_Window(QtWidgets.QWidget, wifi_ui):
    def __init__(self):
        self.__g_ssid = ""
        super().__init__()
        self.setupUi(self)
        self.setWindowTitle("Wifi_Connect")
        self.setGeometry(0, 65, 795, 210)
        self.scan_btn.clicked.connect(self.wifi_scan)
        self.connect_btn.clicked.connect(self.wifi_connect)
        self.exit_btn.clicked.connect(self.back)
        self.wifi_list_widget.itemClicked.connect(self.wifi_selected)
        self.scan_btn.setIcon(QIcon("/home/pi/Hub/icon/scan.png"))
        self.connect_btn.setIcon(QIcon("/home/pi/Hub/icon/connect.png"))
        self.exit_btn.setIcon(QIcon("/home/pi/Hub/icon/exit.png"))

    @property
    def g_ssid(self):
        return self.__g_ssid

    @g_ssid.setter
    def g_ssid(self, value):
        self.__g_ssid = value

    def back(self):
        subprocess.call(['sudo', 'killall', 'matchbox-keyboa'])
        self.wifi_list_widget.clear()
        self.pw_text.clear()
        self.hide()
        Main_Window.show()

    def wifi_scan(self):
        x = wifi_scan_Thread(self)
        x.start()

    def wifi_selected(self):
        selected_wifi = Wifi_Window.wifi_list_widget.currentItem()
        selected_SSID = str(selected_wifi.text())
        ssid = ""
        for i in range(27, len(selected_SSID)-2, 1):
            ssid += selected_SSID[i]
        Wifi_Window.g_ssid = ssid

    def wifi_connect(self):
        Wifi_Window.connect_btn.setEnabled(False)
        g_pw = str(self.pw_text.text())
        print("SSID =" + self.g_ssid + " PW =" + g_pw)
        subprocess.call(['sudo', 'bash', '/home/pi/Hub/shell/wifi_con.sh', self.g_ssid, g_pw])
        self.pw_text.clear()
        self.connect_btn.setEnabled(True)


# 허브의 메인 UI
class Hub_main_Window(QtWidgets.QWidget, hub_ui):
    def __init__(self):
        super().__init__()
        self.setupUi(self)
        self.setWindowTitle("Hub_main")
        self.setGeometry(0, 65, 795, 415)
        self.Translate_btn.clicked.connect(self.run_translate)
        self.Wifi_btn.clicked.connect(self.con_wifi)
        self.exit_btn.clicked.connect(self.shut_down)
        self.Wifi_btn.setIcon(QIcon("/home/pi/Hub/icon/Wifi.png"))
        self.exit_btn.setIcon(QIcon("/home/pi/Hub/icon/hub_power_off.png"))
        self.Translate_btn.setIcon(QIcon("/home/pi/Hub/icon/Live_translate.png"))
        self.show()

    def run_translate(self):
        self.hide()
        Code_Window.show()
        x = keyboard_setup(self)
        x.start()

    def con_wifi(self):
        self.hide()
        Wifi_Window.show()
        x = keyboard_setup(self)
        x.start()

    def shut_down(self):
        QCoreApplication.instance().quit
        subprocess.call(['sudo', 'shutdown', '-h', 'now'])


if __name__ == '__main__':
    stt_client = speech_to_text()
    tts_client = text_to_speech()
    app = QtWidgets.QApplication([])
    Code_Window = Codekey_Window()
    Tran_Window = Translate_Window()
    Wifi_Window = Wifi_Con_Window()
    Main_Window = Hub_main_Window()
    app.exec()