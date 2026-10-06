/**
 * TTS (Text-to-Speech) 유틸리티
 *
 * Azure TTS (백엔드) > Web Speech API (폴백)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

let audioElement: HTMLAudioElement | null = null;
let useBackendTts = true;  // 백엔드 TTS 사용 여부
let voicesLoaded = false;

// iOS 감지
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

/**
 * 백엔드 TTS로 발음 재생 (Azure TTS)
 */
const playWithBackendTts = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    const token = localStorage.getItem('token');
    if (!token) {
      resolve();
      return;
    }

    // 이전 오디오 정리
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    audioElement = new Audio();

    fetch(`${API_BASE_URL}/api/tts/speak?text=${encodeURIComponent(text)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('TTS API 실패');
        }
        return response.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        audioElement!.src = url;
        audioElement!.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audioElement!.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audioElement!.play().catch(() => resolve());
      })
      .catch(() => {
        useBackendTts = false;
        playWithWebSpeech(text).then(resolve);
      });

    setTimeout(resolve, 10000);
  });
};

/**
 * 고품질 영어 음성 선택
 */
const selectBestVoice = (): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();

  // 우선순위: Google > Microsoft Online > Apple > Microsoft > 기타
  const preferredVoices = [
    // Google (Chrome)
    'Google US English',
    'Google UK English Female',
    'Google UK English Male',
    // Microsoft Edge Online (고품질)
    'Microsoft Aria Online',
    'Microsoft Jenny Online',
    'Microsoft Guy Online',
    // Apple (Safari/iOS) - iOS에서 잘 작동하는 음성
    'Samantha',
    'Karen',
    'Daniel',
    'Moira',
    'Tessa',
    // Microsoft 로컬
    'Microsoft Zira',
    'Microsoft David',
  ];

  for (const name of preferredVoices) {
    const voice = voices.find(v => v.name.includes(name));
    if (voice) return voice;
  }

  // Online 음성 우선
  const onlineVoice = voices.find(v =>
    v.lang.startsWith('en') && v.name.includes('Online')
  );
  if (onlineVoice) return onlineVoice;

  // en-US 네트워크 음성
  const networkVoice = voices.find(v =>
    v.lang === 'en-US' && !v.localService
  );
  if (networkVoice) return networkVoice;

  // en-US 음성
  const usVoice = voices.find(v => v.lang === 'en-US');
  if (usVoice) return usVoice;

  // 아무 영어 음성
  return voices.find(v => v.lang.startsWith('en')) || null;
};

/**
 * iOS Safari 버그 워크어라운드
 * speechSynthesis가 멈추는 버그 해결
 */
const iosSpeechWorkaround = () => {
  if (isIOS) {
    // iOS에서 speechSynthesis가 멈추는 버그 해결
    const resumeInterval = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(resumeInterval);
      } else {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 5000);

    // 최대 30초 후 정리
    setTimeout(() => clearInterval(resumeInterval), 30000);
  }
};

/**
 * Web Speech API로 발음 재생 (폴백)
 */
const playWithWebSpeech = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API not supported');
      resolve();
      return;
    }

    // iOS: 음성이 로드되지 않았으면 다시 로드 시도
    if (!voicesLoaded) {
      window.speechSynthesis.getVoices();
    }

    // 이전 발화 취소
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = isIOS ? 0.9 : 0.85;  // iOS는 약간 빠르게
    utterance.pitch = 1;
    utterance.volume = 1;

    const bestVoice = selectBestVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
      console.log('TTS Voice:', bestVoice.name);
    } else {
      console.log('TTS: Using default voice');
    }

    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    utterance.onend = done;
    utterance.onerror = (e) => {
      console.warn('TTS Error:', e);
      done();
    };

    // iOS 워크어라운드 시작
    if (isIOS) {
      iosSpeechWorkaround();
    }

    window.speechSynthesis.speak(utterance);

    // 타임아웃 (iOS에서 이벤트가 발생하지 않을 수 있음)
    setTimeout(done, 5000);
  });
};

/**
 * 영어 텍스트 발음 재생
 */
export const speak = async (text: string): Promise<void> => {
  if (useBackendTts) {
    return playWithBackendTts(text);
  }
  return playWithWebSpeech(text);
};

/**
 * 발음 중지
 */
export const stopSpeaking = (): void => {
  if (audioElement) {
    audioElement.pause();
    audioElement.src = '';
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * TTS 초기화
 */
export const initTTS = async (): Promise<void> => {
  // Web Speech API 음성 목록 로드
  if ('speechSynthesis' in window) {
    // 음성 목록 로드 (iOS에서는 여러 번 호출 필요할 수 있음)
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoaded = true;
        console.log(`TTS: ${voices.length} voices loaded`);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // iOS: 추가 로드 시도
    if (isIOS) {
      setTimeout(loadVoices, 100);
      setTimeout(loadVoices, 500);
      setTimeout(loadVoices, 1000);
    }
  }

  // 백엔드 TTS 상태 확인
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tts/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        useBackendTts = data.enabled;
        console.log(`TTS Provider: ${useBackendTts ? 'Azure TTS' : 'Web Speech API'}`);
      }
    } catch {
      useBackendTts = false;
    }
  }
};
