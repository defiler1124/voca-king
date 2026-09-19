/**
 * 로그인 페이지
 */
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const user = await login(email, password);
      // 관리자는 관리자 페이지로, 학생은 홈으로
      if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch {
      // 에러는 스토어에서 처리
    }
  };

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

        {/* 로그인 폼 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-center mb-6">로그인</h2>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text2)] mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--accent)]"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--accent)] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text2)] mt-6">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-[var(--accent)] font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
