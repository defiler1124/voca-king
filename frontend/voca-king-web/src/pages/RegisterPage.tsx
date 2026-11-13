/**
 * 회원가입 페이지 - V2 숲/지도 테마
 */
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import '../styles/v2-theme.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const [focusField, setFocusField] = useState<string | null>(null);
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (username.length < 4) {
      setLocalError('아이디는 4자 이상이어야 합니다');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 6) {
      setLocalError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    try {
      await register(username, password, name);
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login');
    } catch {
      // 에러는 스토어에서 처리
    }
  };

  const displayError = localError || error;

  const getInputStyle = (field: string) => ({
    width: '100%',
    padding: '12px 14px',
    border: `3px solid ${focusField === field ? '#33a852' : '#d4c4a8'}`,
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: 500,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
    background: '#fff',
    boxShadow: focusField === field ? '0 0 0 3px rgba(51,168,82,0.2)' : 'none'
  });

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
      <div style={{ position: 'absolute', top: '3%', left: '4%', fontSize: '40px', opacity: 0.18, transform: 'rotate(-12deg)' }}>🌳</div>
      <div style={{ position: 'absolute', top: '10%', left: '15%', fontSize: '32px', opacity: 0.15, transform: 'rotate(10deg)' }}>🐵</div>

      {/* 오른쪽 상단 영역 */}
      <div style={{ position: 'absolute', top: '5%', right: '6%', fontSize: '38px', opacity: 0.18, transform: 'rotate(8deg)' }}>🌲</div>
      <div style={{ position: 'absolute', top: '14%', right: '15%', fontSize: '30px', opacity: 0.15, transform: 'rotate(-10deg)' }}>🍌</div>

      {/* 왼쪽 중간 영역 */}
      <div style={{ position: 'absolute', top: '35%', left: '3%', fontSize: '34px', opacity: 0.15, transform: 'rotate(5deg)' }}>🐻</div>
      <div style={{ position: 'absolute', top: '55%', left: '5%', fontSize: '36px', opacity: 0.18, transform: 'rotate(-8deg)' }}>🍃</div>

      {/* 오른쪽 중간 영역 */}
      <div style={{ position: 'absolute', top: '40%', right: '4%', fontSize: '32px', opacity: 0.15, transform: 'rotate(-12deg)' }}>🐰</div>
      <div style={{ position: 'absolute', top: '58%', right: '8%', fontSize: '28px', opacity: 0.18, transform: 'rotate(15deg)' }}>⭐</div>

      {/* 왼쪽 하단 영역 */}
      <div style={{ position: 'absolute', bottom: '20%', left: '5%', fontSize: '35px', opacity: 0.18, transform: 'rotate(8deg)' }}>🐼</div>
      <div style={{ position: 'absolute', bottom: '10%', left: '12%', fontSize: '30px', opacity: 0.15, transform: 'rotate(-5deg)' }}>🦋</div>

      {/* 오른쪽 하단 영역 */}
      <div style={{ position: 'absolute', bottom: '18%', right: '6%', fontSize: '32px', opacity: 0.15, transform: 'rotate(-8deg)' }}>🐱</div>
      <div style={{ position: 'absolute', bottom: '8%', right: '14%', fontSize: '36px', opacity: 0.18, transform: 'rotate(10deg)' }}>🌿</div>

      {/* 로고 영역 */}
      <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: '44px',
          marginBottom: '6px',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
        }}>
          👑
        </div>
        <div style={{
          fontFamily: "'Baloo 2', 'Noto Sans KR', sans-serif",
          fontSize: '32px',
          fontWeight: 800,
          color: '#fff',
          textShadow: '0 3px 0 #2b7a1f, 2px 2px 0 #2b7a1f, -2px 2px 0 #2b7a1f, 0 0 10px rgba(0,0,0,0.2)',
          letterSpacing: '2px'
        }}>
          VOCA KING
        </div>
        <p style={{
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          marginTop: '4px'
        }}>
          영어 단어 마스터의 시작
        </p>
      </div>

      {/* 회원가입 카드 */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: '#fffdf3',
        borderRadius: '24px',
        padding: '28px 24px',
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
          회원가입
        </div>

        {displayError && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '10px 14px',
            borderRadius: '12px',
            marginTop: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            textAlign: 'center',
            fontWeight: 600,
            border: '2px solid #ef9a9a'
          }}>
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '12px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#5b3a1e',
              marginBottom: '6px'
            }}>
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusField('name')}
              onBlur={() => setFocusField(null)}
              style={getInputStyle('name')}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#5b3a1e',
              marginBottom: '6px'
            }}>
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusField('username')}
              onBlur={() => setFocusField(null)}
              style={getInputStyle('username')}
              placeholder="아이디 (4자 이상)"
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#5b3a1e',
              marginBottom: '6px'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusField('password')}
              onBlur={() => setFocusField(null)}
              style={getInputStyle('password')}
              placeholder="비밀번호 (6자 이상)"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#5b3a1e',
              marginBottom: '6px'
            }}>
              비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusField('confirmPassword')}
              onBlur={() => setFocusField(null)}
              style={getInputStyle('confirmPassword')}
              placeholder="비밀번호 다시 입력"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: isLoading ? '#aaa' : 'linear-gradient(180deg, #4CAF50 0%, #33a852 100%)',
              color: '#fff',
              border: '3px solid #2b7a1f',
              borderRadius: '16px',
              fontSize: '16px',
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
            {isLoading ? '가입 중...' : '가입하기 🎉'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '2px dashed #d4c4a8'
        }}>
          <span style={{ color: '#8b7355', fontSize: '14px', fontWeight: 500 }}>
            이미 계정이 있으신가요?{' '}
          </span>
          <Link
            to="/login"
            style={{
              color: '#ff8a1d',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            로그인
          </Link>
        </div>
      </div>

      {/* 푸터 */}
      <div style={{
        marginTop: '20px',
        marginBottom: '70px',
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
