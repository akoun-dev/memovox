import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter_tts/flutter_tts.dart';

class VoiceService {
  final SpeechToText _speech = SpeechToText();
  final FlutterTts _tts = FlutterTts();

  Future<bool> init() async {
    return _speech.initialize();
  }

  Future<void> speak(String text) async {
    await _tts.speak(text);
  }

  Future<void> listen(Function(String) onResult) async {
    await _speech.listen(onResult: (result) {
      if (result.finalResult) {
        onResult(result.recognizedWords);
      }
    });
  }

  void stop() {
    _speech.stop();
  }
}
