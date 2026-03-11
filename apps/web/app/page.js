"use client";

import { useEffect, useState } from 'react';

// この Home() という関数がダッシュボードのメイン画面を作っています
export default function Home() {
  // 📦 画面に表示する状態（データ）を保存する箱（State）を用意します
  const [dashboardData, setDashboardData] = useState(null); // 取得したデータを入れる箱
  const [isLoading, setIsLoading] = useState(true);         // 読み込み中かどうかを判定するフラグ
  const [error, setError] = useState(null);                 // エラーが起きた時のメッセージを入れる箱

  // ⚡ 画面が開いた時（また、5秒ごと）に実行される処理
  useEffect(() => {
    // --- APIからデータを取ってくる関数 ---
    const fetchData = async () => {
      try {
        // バックエンドAPIに「データちょうだい！」とお願いする
        const res = await fetch('http://localhost:3001/api/dashboard');

        // もしうまく繋がらなかったらエラーにする
        if (!res.ok) throw new Error('API request failed');

        // 受け取ったデータをJSONという形式に変換して、箱（dashboardData）に入れる
        const data = await res.json();
        setDashboardData(data);
        setError(null); // エラーなし！
      } catch (err) {
        console.error(err);
        // エラー内容を箱に入れて、画面に表示させるようにする
        setError('APIが見つかりません。バックエンドが起動しているか確認してください。');
      } finally {
        // 成功しても失敗しても、「読み込み中」状態は終わらせる
        setIsLoading(false);
      }
    };

    // 1. まず最初に1回データを取得する
    fetchData();

    // 2. 5秒（5000ミリ秒）ごとに同じ取得作業をポロポロ繰り返す（更新させる）
    const intervalId = setInterval(fetchData, 5000);

    // 画面を閉じた時にこのインターバルも一緒に片付ける
    return () => clearInterval(intervalId);
  }, []);

  // ⏰ --- 秒数を「○時間○分○秒」という見やすい文字に変える便利関数 ---
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);           // 時間
    const m = Math.floor((seconds % 3600) / 60);    // 分
    const s = seconds % 60;                         // 秒

    if (h > 0) return `${h}時間 ${m}分`;
    if (m > 0) return `${m}分 ${s}秒`;
    return `${s}秒`;
  };

  // --- 🎨 状態によって画面の表示を切り替える ---

  // データ取得中の時はこの文字だけ表示する
  if (isLoading) return <div className="loading">Loading assets...</div>;

  // エラーが起きていたらエラーメッセージだけ表示する
  if (error) return <div className="error-card">{error}</div>;

  // 問題なければ、いよいよダッシュボードの中身を作って表示します！
  return (
    <div className="dashboard-grid">

      {/* --- 1つ目のカード：使った総時間 --- */}
      <div className="card overview-card glass-panel">
        <h2>今日SNSに使った総時間</h2>
        <div className="huge-time">
          {/* ここでformatTime関数を使って表示 */}
          {formatTime(dashboardData.totalTimeSeconds)}
        </div>
      </div>

      {/* --- 2つ目のカード：失ったお金の価値💰 --- */}
      <div className="card conversion-card glass-panel">
        <h2>失った資産 (仮定時給換算)</h2>
        {/* 円換算 (toLocaleString()でカンマを入れる) */}
        <div className="asset-value jpy">
          - ¥ {dashboardData.assets.jpy.toLocaleString()}
        </div>
        {/* ビットコイン換算 */}
        <div className="asset-value btc">
          - {dashboardData.assets.btc} BTC
        </div>
      </div>

      {/* --- 3つ目のカード：各SNSごとの内訳ランキングリスト --- */}
      <div className="card breakdown-card glass-panel">
        <h2>サイト別消費時間</h2>
        <ul className="site-list">
          {/* dashboardData.timeDataの中身（youtube, xなど）をループして作る */}
          {Object.entries(dashboardData.timeData)
            .filter(([_, time]) => time > 0) // 0秒のサイトは表示しない
            .map(([site, time]) => (
              // 各サイトの表示行
              <li key={site} className="site-item">
                {/* 頭文字を大文字にする */}
                <span className="site-name">
                  {site.charAt(0).toUpperCase() + site.slice(1)}
                </span>
                {/* 時間 */}
                <span className="site-time">{formatTime(time)}</span>
              </li>
            ))}

          {/* もし全部0秒だったら、このメッセージを出す */}
          {Object.values(dashboardData.timeData).every(v => v === 0) && (
            <li className="no-data">まだデータがありません。監視対象のSNSを閲覧するとここに表示されます。</li>
          )}
        </ul>
      </div>

      {/* 👗 ここから下はこの画面だけで使う専用のCSS（デザインルール）です */}
      <style jsx>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }
        .glass-panel {
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .huge-time {
          font-size: 3.5rem;
          font-weight: 900;
          color: var(--text-main);
          margin-top: 1rem;
        }
        .asset-value {
          margin-top: 1rem;
        }
        .jpy {
          font-size: 3rem;
          font-weight: 800;
          color: var(--danger);
        }
        .btc {
          font-size: 1.5rem;
          color: #f59e0b;
        }
        .site-list {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0 0 0;
        }
        .site-item {
          display: flex;
          justify-content: space-between;
          padding: 1.25rem;
          background: rgba(0,0,0,0.2);
          margin-bottom: 0.75rem;
          border-radius: 8px;
        }
        .site-name {
          font-weight: 600;
          color: var(--accent);
          font-size: 1.1rem;
        }
        .site-time {
          font-weight: bold;
          color: var(--text-main);
        }
        .no-data {
          color: var(--text-muted);
          text-align: center;
          padding: 2rem;
        }
        .loading {
          text-align: center;
          font-size: 1.5rem;
          color: var(--text-muted);
          padding: 5rem;
        }
        .error-card {
           background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          text-align: center;
        }
      `}</style>
    </div>
  );
}
