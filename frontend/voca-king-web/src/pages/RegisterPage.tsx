/**
 * 회원가입 페이지 - 세련된 디자인
 */
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 6) {
      setLocalError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    try {
      await register(email, password, name);
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login');
    } catch {
      // 에러는 스토어에서 처리
    }
  };

  const displayError = localError || error;

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B2A5B 0%, #2D3E7D 50%, #1B2A5B 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* 로고 영역 */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          fontSize: '36px',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '2px',
          marginBottom: '8px'
        }}>
          VOCA <span style={{ color: '#FFCA57' }}>KING</span> 👑
        </div>
        <p style={{ color: '#AEB8DE', fontSize: '14px' }}>
          영어 단어 마스터의 시작
        </p>
      </div>

      {/* 회원가입 카드 */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#fff',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 800,
          color: '#1B2A5B',
          marginBottom: '28px'
        }}>
          회원가입
        </h2>

        {displayError && (
          <div style={{
            background: '#FFEBEE',
            color: '#C62828',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#666',
              marginBottom: '8px'
            }}>
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#1B2A5B'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#666',
              marginBottom: '8px'
            }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#1B2A5B'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              placeholder="이메일을 입력하세요"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#666',
              marginBottom: '8px'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#1B2A5B'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              placeholder="비밀번호를 입력하세요 (6자 이상)"
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#666',
              marginBottom: '8px'
            }}>
              비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#1B2A5B'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              background: isLoading ? '#999' : 'linear-gradient(135deg, #0B8850 0%, #00726A 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: isLoading ? 'default' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 15px rgba(11, 136, 80, 0.4)'
            }}
            onMouseOver={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          <span style={{ color: '#888', fontSize: '14px' }}>
            이미 계정이 있으신가요?{' '}
          </span>
          <Link
            to="/login"
            style={{
              color: '#D32F3F',
              fontWeight: 600,
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
        marginTop: '24px',
        textAlign: 'center',
        color: '#AEB8DE',
        fontSize: '12px'
      }}>
        © 2026 플로우어학원. All Rights Reserved.
      </div>
    </div>
  );
}
