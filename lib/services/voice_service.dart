import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

class VoiceService {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;
  String _lastResult = '';

  Future<bool> initialize() async {
    return await _speech.initialize();
  }

  Future<String?> startListening({
    required VoidCallback onListeningChanged,
    required ValueChanged<String> onPartialResult,
  }) async {
    if (_isListening) return null;
    
    _isListening = true;
    onListeningChanged();
    
    _speech.listen(
      onResult: (result) {
        if (result.finalResult) {
          _lastResult = result.recognizedWords;
        } else {
          onPartialResult(result.recognizedWords);
        }
      },
      localeId: 'fr_FR',
      listenFor: const Duration(minutes: 2),
      cancelOnError: true,
    );

    return null;
  }

  Future<String?> stopListening() async {
    if (!_isListening) return null;
    
    await _speech.stop();
    _isListening = false;
    return _lastResult.isNotEmpty ? _lastResult : null;
  }

  void cancelListening() {
    _speech.cancel();
    _isListening = false;
    _lastResult = '';
  }
}