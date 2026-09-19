/**
 * TTS (Text-to-Speech) 유틸리티
 *
 * ResponsiveVoice.js 또는 Web Speech API를 사용한 영어 발음 재생
 */

// ResponsiveVoice 타입 정의
declare global {
  interface Window {
    responsiveVoice?: {
      speak: (text: string, voice: string, options?: object) => void;
      cancel: () => void;
      isPlaying: () => boolean;
    };
  }
}

// 선호하는 영어 음성 (UK English 또는 US English)
const PREFERRED_VOICE = 'UK English Female';
const FALLBACK_VOICE = 'US English Female';

/**
 * 영어 텍스트 발음 재생
 *
 * ResponsiveVoice가 로드되어 있으면 사용하고,
 * 없으면 Web Speech API를 사용합니다.
 *
 * @param text 발음할 영어 텍스트
 * @returns Promise - 발음 완료 시 resolve
 */
export const speak = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    // ResponsiveVoice 사용 시도
    if (window.responsiveVoice) {
      window.responsiveVoice.speak(text, PREFERRED_VOICE, {
        onend: () => resolve(),
        onerror: () => {
          // 실패 시 Web Speech API 폴백
          speakWithWebSpeech(text).then(resolve);
        },
      });
      return;
    }

    // Web Speech API 사용
    speakWithWebSpeech(text).then(resolve);
  });
};

/**
 * Web Speech API를 사용한 발음
 */
const speakWithWebSpeech = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('이 브라우저는 음성 합성을 지원하지 않습니다.');
      resolve();
      return;
    }

    // 진행 중인 발음 취소
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // 약간 느리게

    // 영어 음성 찾기
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.includes('Female')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    speechSynthesis.speak(utterance);
  });
};

/**
 * 발음 중지
 */
export const stopSpeaking = (): void => {
  if (window.responsiveVoice?.isPlaying()) {
    window.responsiveVoice.cancel();
  }
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
};

/**
 * ResponsiveVoice 스크립트 로드
 * index.html에 추가하거나, 동적으로 로드
 */
export const loadResponsiveVoice = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.responsiveVoice) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=FREE';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.warn('ResponsiveVoice 로드 실패, Web Speech API 사용');
      resolve();
    };
    document.head.appendChild(script);
  });
};
