/**
 * 로그인 페이지 - V2 숲/지도 테마
 */
import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import '../styles/v2-theme.css';

const REMEMBER_KEY = 'voca_king_remember';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  // 저장된 로그인 정보 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      try {
        const { username: savedUsername, password: savedPassword } = JSON.parse(atob(saved));
        setUsername(savedUsername || '');
        setPassword(savedPassword || '');
        setRememberMe(true);
      } catch {
        localStorage.removeItem(REMEMBER_KEY);
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const user = await login(username, password);

      // 로그인 성공 시 기억하기 처리
      if (rememberMe) {
        const data = btoa(JSON.stringify({ username, password }));
        localStorage.setItem(REMEMBER_KEY, data);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch {
      // 에러는 스토어에서 처리
    }
  };

  // 입력 시 에러 메시지 지우기
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) clearError();
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) clearError();
    setPassword(e.target.value);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #4a9f38 0%, #7fd04a 40%, #a8e063 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 배경 장식 - 각 게임 테마 이모티콘 */}
      {/* 왼쪽 상단 영역 */}
      <div style={{ position: 'absolute', top: '5%', left: '3%', fontSize: '45px', opacity: 0.2, transform: 'rotate(-10deg)' }}>🌳</div>
      <div style={{ position: 'absolute', top: '12%', left: '12%', fontSize: '35px', opacity: 0.18, transform: 'rotate(15deg)' }}>🍌</div>
      <div style={{ position: 'absolute', top: '22%', left: '5%', fontSize: '38px', opacity: 0.15, transform: 'rotate(-5deg)' }}>🐵</div>

      {/* 오른쪽 상단 영역 */}
      <div style={{ position: 'absolute', top: '6%', right: '5%', fontSize: '42px', opacity: 0.18, transform: 'rotate(12deg)' }}>🌲</div>
      <div style={{ position: 'absolute', top: '15%', right: '12%', fontSize: '36px', opacity: 0.2, transform: 'rotate(-8deg)' }}>🐻</div>
      <div style={{ position: 'absolute', top: '25%', right: '4%', fontSize: '32px', opacity: 0.15, transform: 'rotate(20deg)' }}>⭐</div>

      {/* 왼쪽 중간 영역 */}
      <div style={{ position: 'absolute', top: '38%', left: '2%', fontSize: '34px', opacity: 0.15, transform: 'rotate(8deg)' }}>🐰</div>
      <div style={{ position: 'absolute', top: '52%', left: '6%', fontSize: '40px', opacity: 0.18, transform: 'rotate(-12deg)' }}>🍃</div>

      {/* 오른쪽 중간 영역 */}
      <div style={{ position: 'absolute', top: '42%', right: '3%', fontSize: '36px', opacity: 0.18, transform: 'rotate(-15deg)' }}>🐼</div>
      <div style={{ position: 'absolute', top: '55%', right: '8%', fontSize: '32px', opacity: 0.15, transform: 'rotate(10deg)' }}>🦋</div>

      {/* 왼쪽 하단 영역 */}
      <div style={{ position: 'absolute', bottom: '25%', left: '4%', fontSize: '38px', opacity: 0.2, transform: 'rotate(5deg)' }}>🐶</div>
      <div style={{ position: 'absolute', bottom: '15%', left: '10%', fontSize: '42px', opacity: 0.15, transform: 'rotate(-8deg)' }}>🌿</div>
      <div style={{ position: 'absolute', bottom: '8%', left: '3%', fontSize: '30px', opacity: 0.18, transform: 'rotate(15deg)' }}>🏆</div>

      {/* 오른쪽 하단 영역 */}
      <div style={{ position: 'absolute', bottom: '22%', right: '5%', fontSize: '35px', opacity: 0.18, transform: 'rotate(-10deg)' }}>🐱</div>
      <div style={{ position: 'absolute', bottom: '12%', right: '12%', fontSize: '38px', opacity: 0.15, transform: 'rotate(8deg)' }}>🍌</div>
      <div style={{ position: 'absolute', bottom: '6%', right: '4%', fontSize: '32px', opacity: 0.2, transform: 'rotate(-5deg)' }}>🌸</div>

      {/* 로고 영역 */}
      <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: '52px',
          marginBottom: '8px',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
        }}>
          👑
        </div>
        <div style={{
          fontFamily: "'Baloo 2', 'Noto Sans KR', sans-serif",
          fontSize: '36px',
          fontWeight: 800,
          color: '#fff',
          textShadow: '0 3px 0 #2b7a1f, 2px 2px 0 #2b7a1f, -2px 2px 0 #2b7a1f, 0 0 10px rgba(0,0,0,0.2)',
          letterSpacing: '2px'
        }}>
          VOCA KING
        </div>
        <p style={{
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          marginTop: '4px'
        }}>
          영어 단어 마스터의 시작
        </p>
      </div>

      {/* 로그인 카드 */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: '#fffdf3',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: '0 8px 0 #5b3a1e, 0 12px 40px rgba(0,0,0,0.15)',
        border: '4px solid #5b3a1e',
        position: 'relative',
        zIndex: 1
      }}>
        {/* 카드 상단 장식 */}
        <div style={{
          position: 'absolute',
          top: '-18px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff8a1d',
          color: '#fff',
          padding: '6px 20px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 800,
          boxShadow: '0 3px 0 #c46a10',
          border: '3px solid #5b3a1e'
        }}>
          로그인
        </div>

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px 16px',
            borderRadius: '12px',
            marginTop: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: 600,
            border: '2px solid #ef9a9a'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#5b3a1e',
              marginBottom: '8px'
            }}>
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              onFocus={() => setFocusField('username')}
              onBlur={() => setFocusField(null)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: `3px solid ${focusField === 'username' ? '#33a852' : '#d4c4a8'}`,
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 500,
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
                background: '#fff',
                boxShadow: focusField === 'username' ? '0 0 0 3px rgba(51,168,82,0.2)' : 'none'
              }}
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#5b3a1e',
              marginBottom: '8px'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              onFocus={() => setFocusField('password')}
              onBlur={() => setFocusField(null)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: `3px solid ${focusField === 'password' ? '#33a852' : '#d4c4a8'}`,
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 500,
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
                background: '#fff',
                boxShadow: focusField === 'password' ? '0 0 0 3px rgba(51,168,82,0.2)' : 'none'
              }}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {/* 아이디/비밀번호 기억하기 체크박스 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#5b3a1e',
              fontWeight: 600,
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginRight: '10px',
                  accentColor: '#33a852',
                  cursor: 'pointer'
                }}
              />
              아이디/비밀번호 기억하기
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              background: isLoading ? '#aaa' : 'linear-gradient(180deg, #4CAF50 0%, #33a852 100%)',
              color: '#fff',
              border: '3px solid #2b7a1f',
              borderRadius: '16px',
              fontSize: '17px',
              fontWeight: 800,
              cursor: isLoading ? 'default' : 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: isLoading ? 'none' : '0 5px 0 #2b7a1f',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
            onMouseDown={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(3px)';
                e.currentTarget.style.boxShadow = '0 2px 0 #2b7a1f';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 5px 0 #2b7a1f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 5px 0 #2b7a1f';
            }}
          >
            {isLoading ? '로그인 중...' : '시작하기 🚀'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '2px dashed #d4c4a8'
        }}>
          <span style={{ color: '#8b7355', fontSize: '14px', fontWeight: 500 }}>
            계정이 없으신가요?{' '}
          </span>
          <Link
            to="/register"
            style={{
              color: '#ff8a1d',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            회원가입
          </Link>
        </div>
      </div>

      {/* 푸터 */}
      <div style={{
        marginTop: '24px',
        marginBottom: '80px',
        textAlign: 'center',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 500,
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        position: 'relative',
        zIndex: 1
      }}>
        © 2026 플로우어학원. All Rights Reserved.
      </div>

      {/* 잔디 바닥 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50px',
        background: 'linear-gradient(180deg, #5cb340 0%, #4a9930 100%)',
        borderTop: '4px solid #3d8028'
      }} />
    </div>
  );
}
