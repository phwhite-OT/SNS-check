'use client';

import { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'ログインに失敗しました');
        return;
      }

      // ログイン成功時のコールバック
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError('エラーが発生しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'サインアップに失敗しました');
        return;
      }

      setError('');
      alert('確認メールを送信しました。メールボックスを確認してください。');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('エラーが発生しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-head">
          <span className="auth-badge">MISSION CONTROL</span>
          <h1 className="auth-brand">Focus Quest</h1>
          <p className="auth-subtitle">ログインして、今日の集中ミッションを開始しよう。</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle className="auth-error-icon" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">
              メールアドレス
            </label>
            <div className="auth-input-wrap">
              <Mail className="auth-input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              パスワード
            </label>
            <div className="auth-input-wrap">
              <Lock className="auth-input-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-btn auth-btn-primary">
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="auth-divider">
          <span>アカウントをお持ちでない場合</span>
        </div>

        <button onClick={handleSignUp} disabled={loading} className="auth-btn auth-btn-secondary">
          {loading ? '処理中...' : '新規登録'}
        </button>
      </div>
    </div>
  );
}
