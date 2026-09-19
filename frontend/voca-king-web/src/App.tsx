/**
 * VOCA KING 메인 앱 컴포넌트
 *
 * 라우팅 설정 및 인증 상태 관리
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { loadResponsiveVoice } from './utils/tts';

// 페이지 컴포넌트
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';

/**
 * Protected Route 컴포넌트
 * 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 인증 확인 중
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-[var(--text2)]">로딩 중...</div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Public Route 컴포넌트
 * 이미 로그인한 사용자는 홈으로 리다이렉트
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  // ResponsiveVoice TTS 로드
  useEffect(() => {
    loadResponsiveVoice();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* 보호된 라우트 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* 404 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
