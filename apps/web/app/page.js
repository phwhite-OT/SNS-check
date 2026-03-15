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
      <div className="boot-screen">
        <div className="boot-card">
          <div className="boot-ring" />
          <h2>Focus Quest</h2>
          <p>今日のミッションを読み込み中...</p>
        </div>
      </div>
    );
  }

  // ログイン状態に応じて画面を切り替え
  if (!user) {
    return (
      <div className="login-page">
        <div className="login-layout">
          <div className="login-left">
            <div className="login-deco">
              <div className="login-deco-card login-deco-card--large" />
              <div className="login-deco-card login-deco-card--medium" />
              <div className="login-deco-card login-deco-card--small" />
              <div className="login-deco-badge" />
              <div className="login-deco-meter">
                <span>集中ゲージ</span>
                <strong>76%</strong>
              </div>
            </div>
            <div className="login-copy">
              <p className="login-kicker">UNIVERSITY STARTER MODE</p>
              <h1 className="login-title">SNSの衝動を、学習クエストに変える。</h1>
              <p className="login-subtitle">大学生活の最初の習慣づくりを、ゲーム感覚で。ToDo管理と閲覧ログをひとつの画面で見える化します。</p>
              <ul className="login-feature-list">
                <li className="login-feature-item"><span>01</span> 期限つきタスクで「今やること」を固定</li>
                <li className="login-feature-item"><span>02</span> URL分析でSNS時間を見える化</li>
                <li className="login-feature-item"><span>03</span> 1日ごとの達成率で小さく勝ち続ける</li>
              </ul>
            </div>
            <div className="login-quick-stats">
              <div className="quick-stat">
                <span>今日の目標</span>
                <strong>90分の集中</strong>
              </div>
              <div className="quick-stat">
                <span>想定ロス削減</span>
                <strong>¥2,400 / 週</strong>
              </div>
            </div>
          </div>
          <div className="login-right">
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      </div>
    );
  }

  // ログイン済み：ダッシュボード表示
  return <Dashboard user={user} onLogout={handleLogout} />;
}
