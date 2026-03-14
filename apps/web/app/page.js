'use client';

import { useEffect, useState } from 'react';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';

/**
 * SNS Check メインページ
 * 
 * Supabase認証機能を使用した認証実装：
 * 1. ページロード時に /api/auth/me でセッション確認
 * 2. セッションが有効 → ダッシュボード表示
 * 3. セッションがない → ログイン画面表示
 * 
 * セッション情報はクッキーに保存され、ページをリロードしても保持される
 */
export default function Home() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * コンポーネントマウント時にセッション確認を実行
   */
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * セッション情報を確認（ログイン情報が保存されているか）
   */
  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // クッキーを含める
      });

      const data = await response.json();

      if (data.authenticated && data.user) {
        // ログイン済み：ユーザー情報を設定
        setUser(data.user);
      } else {
        // ログインなし：null を設定（ログイン画面表示）
        setUser(null);
      }
    } catch (error) {
      console.error('セッション確認エラー:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ログイン成功時のコールバック
   */
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  /**
   * ログアウト時のコールバック
   */
  const handleLogout = () => {
    setUser(null);
  };

  // ローディング画面
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 50,
            height: 50,
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem',
          }} />
          <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 500 }}>
            読み込み中...
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ログイン状態に応じて画面を切り替え
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // ログイン済み：ダッシュボード表示
  return <Dashboard user={user} onLogout={handleLogout} />;
}
