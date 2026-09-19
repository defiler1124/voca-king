/**
 * 회원가입 페이지
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

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setLocalError('비밀번호가 일치하지 않습니다');
      return;
    }

    // 비밀번호 길이 확인
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[var(--deepblue)]">
            VOCA <span className="text-[var(--deepblue-gold)]">KING</span>
          </h1>
          <p className="text-[var(--text2)] mt-2">영어 단어 마스터</p>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-center mb-6">회원가입</h2>

          {displayError && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text2)] mb-1">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--accent)]"
                placeholder="이름을 입력하세요"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text2)] mb-1">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--accent)]"
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text2)] mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--accent)]"
                placeholder="비밀번호를 입력하세요 (6자 이상)"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text2)] mb-1">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--accent)]"
                placeholder="비밀번호를 다시 입력하세요"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--accent)] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text2)] mt-6">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-[var(--accent)] font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
