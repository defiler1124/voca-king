/**
 * TTS (Text-to-Speech) 유틸리티
 *
 * Web Speech API를 사용한 영어 발음 재생
 * 모바일 (iOS/Android) 지원
 */

// 음성 목록 캐시
let voicesLoaded = false;
let cachedVoices: SpeechSynthesisVoice[] = [];

/**
 * 음성 목록 로드 (iOS는 비동기로 로드됨)
 */
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (voicesLoaded && cachedVoices.length > 0) {
      resolve(cachedVoices);
      return;
    }

    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      voicesLoaded = true;
      resolve(voices);
      return;
    }

    // iOS Safari는 voiceschanged 이벤트 후에 음성 목록이 로드됨
    const handleVoicesChanged = () => {
      cachedVoices = speechSynthesis.getVoices();
      voicesLoaded = true;
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(cachedVoices);
    };

    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // 타임아웃: 1초 후에도 로드 안 되면 빈 배열 반환
    setTimeout(() => {
      if (!voicesLoaded) {
        cachedVoices = speechSynthesis.getVoices();
        voicesLoaded = true;
        resolve(cachedVoices);
      }
    }, 1000);
  });
};

/**
 * 영어 음성 찾기
 */
const findEnglishVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  // 우선순위: 1. 영어 여성 음성, 2. 영어 음성, 3. 기본 음성
  const englishFemale = voices.find(
    (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
  );
  if (englishFemale) return englishFemale;

  const englishVoice = voices.find((v) => v.lang.startsWith('en'));
  if (englishVoice) return englishVoice;

  // iOS/macOS의 기본 영어 음성들
  const iosEnglish = voices.find((v) =>
    v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel')
  );
  if (iosEnglish) return iosEnglish;

  return voices[0] || null;
};

/**
 * 영어 텍스트 발음 재생
 *
 * @param text 발음할 영어 텍스트
 * @returns Promise - 발음 완료 시 resolve
 */
export const speak = async (text: string): Promise<void> => {
  if (!('speechSynthesis' in window)) {
    console.warn('이 브라우저는 음성 합성을 지원하지 않습니다.');
    return;
  }

  // 진행 중인 발음 취소
  speechSynthesis.cancel();

  // 음성 목록 로드
  const voices = await loadVoices();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = findEnglishVoice(voices);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.warn('TTS 오류:', e);
      resolve();
    };

    // iOS Safari 버그 수정: 약간의 딜레이 후 speak 호출
    setTimeout(() => {
      speechSynthesis.speak(utterance);
    }, 10);

    // iOS에서 음성이 멈추는 버그 수정: 주기적으로 resume 호출
    const resumeInterval = setInterval(() => {
      if (!speechSynthesis.speaking) {
        clearInterval(resumeInterval);
      } else {
        speechSynthesis.resume();
      }
    }, 300);

    // 최대 10초 후 타임아웃
    setTimeout(() => {
      clearInterval(resumeInterval);
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      resolve();
    }, 10000);
  });
};

/**
 * 발음 중지
 */
export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
};

/**
 * TTS 초기화 (페이지 로드 시 호출 권장)
 * 음성 목록을 미리 로드합니다.
 */
export const initTTS = async (): Promise<void> => {
  if ('speechSynthesis' in window) {
    await loadVoices();
  }
};
