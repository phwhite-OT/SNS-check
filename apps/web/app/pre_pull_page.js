"use client";

import { useEffect, useState } from 'react';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ||
  `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')}/api`
).replace(/\/$/, '');

// 縺薙・ Home() 縺ｨ縺・≧髢｢謨ｰ縺後ム繝・す繝･繝懊・繝峨・繝｡繧､繝ｳ逕ｻ髱｢繧剃ｽ懊▲縺ｦ縺・∪縺・export default function Home() {
  // 逃 逕ｻ髱｢縺ｫ陦ｨ遉ｺ縺吶ｋ迥ｶ諷具ｼ医ョ繝ｼ繧ｿ・峨ｒ菫晏ｭ倥☆繧狗ｮｱ・・tate・峨ｒ逕ｨ諢上＠縺ｾ縺・  const [dashboardData, setDashboardData] = useState(null); // 蜿門ｾ励＠縺溘ョ繝ｼ繧ｿ繧貞・繧後ｋ邂ｱ
  const [isLoading, setIsLoading] = useState(true);         // 隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ縺九←縺・°繧貞愛螳壹☆繧九ヵ繝ｩ繧ｰ
  const [error, setError] = useState(null);                 // 繧ｨ繝ｩ繝ｼ縺瑚ｵｷ縺阪◆譎ゅ・繝｡繝・そ繝ｼ繧ｸ繧貞・繧後ｋ邂ｱ

  // 笞｡ 逕ｻ髱｢縺碁幕縺・◆譎ゑｼ医∪縺溘・遘偵＃縺ｨ・峨↓螳溯｡後＆繧後ｋ蜃ｦ逅・  useEffect(() => {
    // --- API縺九ｉ繝・・繧ｿ繧貞叙縺｣縺ｦ縺上ｋ髢｢謨ｰ ---
    const fetchData = async () => {
      try {
        // 繝舌ャ繧ｯ繧ｨ繝ｳ繝陰PI縺ｫ縲後ョ繝ｼ繧ｿ縺｡繧・≧縺縺・ｼ√阪→縺企｡倥＞縺吶ｋ
        const res = await fetch(`${API_BASE}/dashboard`);

        // 繧ゅ＠縺・∪縺冗ｹ九′繧峨↑縺九▲縺溘ｉ繧ｨ繝ｩ繝ｼ縺ｫ縺吶ｋ
        if (!res.ok) throw new Error('API request failed');

        // 蜿励￠蜿悶▲縺溘ョ繝ｼ繧ｿ繧谷SON縺ｨ縺・≧蠖｢蠑上↓螟画鋤縺励※縲∫ｮｱ・・ashboardData・峨↓蜈･繧後ｋ
        const data = await res.json();
        setDashboardData(data);
        setError(null); // 繧ｨ繝ｩ繝ｼ縺ｪ縺暦ｼ・      } catch (err) {
        console.error(err);
        // 繧ｨ繝ｩ繝ｼ蜀・ｮｹ繧堤ｮｱ縺ｫ蜈･繧後※縲∫判髱｢縺ｫ陦ｨ遉ｺ縺輔○繧九ｈ縺・↓縺吶ｋ
        setError('API縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縲ゅヰ繝・け繧ｨ繝ｳ繝峨′襍ｷ蜍輔＠縺ｦ縺・ｋ縺狗｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
      } finally {
        // 謌仙粥縺励※繧ょ､ｱ謨励＠縺ｦ繧ゅ√瑚ｪｭ縺ｿ霎ｼ縺ｿ荳ｭ縲咲憾諷九・邨ゅｏ繧峨○繧・        setIsLoading(false);
      }
    };

    // 1. 縺ｾ縺壽怙蛻昴↓1蝗槭ョ繝ｼ繧ｿ繧貞叙蠕励☆繧・    fetchData();

    // 2. 5遘抵ｼ・000繝溘Μ遘抵ｼ峨＃縺ｨ縺ｫ蜷後§蜿門ｾ嶺ｽ懈･ｭ繧偵・繝ｭ繝昴Ο郢ｰ繧願ｿ斐☆・域峩譁ｰ縺輔○繧具ｼ・    const intervalId = setInterval(fetchData, 5000);

    // 逕ｻ髱｢繧帝哩縺倥◆譎ゅ↓縺薙・繧､繝ｳ繧ｿ繝ｼ繝舌Ν繧ゆｸ邱偵↓迚・ｻ倥￠繧・    return () => clearInterval(intervalId);
  }, []);

  // 竢ｰ --- 遘呈焚繧偵娯雷譎る俣笳句・笳狗ｧ偵阪→縺・≧隕九ｄ縺吶＞譁・ｭ励↓螟峨∴繧倶ｾｿ蛻ｩ髢｢謨ｰ ---
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);           // 譎る俣
    const m = Math.floor((seconds % 3600) / 60);    // 蛻・    const s = seconds % 60;                         // 遘・
    if (h > 0) return `${h}譎る俣 ${m}蛻・;
    if (m > 0) return `${m}蛻・${s}遘蛋;
    return `${s}遘蛋;
  };

  // --- 耳 迥ｶ諷九↓繧医▲縺ｦ逕ｻ髱｢縺ｮ陦ｨ遉ｺ繧貞・繧頑崛縺医ｋ ---

  // 繝・・繧ｿ蜿門ｾ嶺ｸｭ縺ｮ譎ゅ・縺薙・譁・ｭ励□縺題｡ｨ遉ｺ縺吶ｋ
  if (isLoading) return <div className="loading">Loading assets...</div>;

  // 繧ｨ繝ｩ繝ｼ縺瑚ｵｷ縺阪※縺・◆繧峨お繝ｩ繝ｼ繝｡繝・そ繝ｼ繧ｸ縺縺題｡ｨ遉ｺ縺吶ｋ
  if (error) return <div className="error-card">{error}</div>;

  // 蝠城｡後↑縺代ｌ縺ｰ縲√＞繧医＞繧医ム繝・す繝･繝懊・繝峨・荳ｭ霄ｫ繧剃ｽ懊▲縺ｦ陦ｨ遉ｺ縺励∪縺呻ｼ・  return (
    <div className="dashboard-grid">

      {/* --- 1縺､逶ｮ縺ｮ繧ｫ繝ｼ繝会ｼ壻ｽｿ縺｣縺溽ｷ乗凾髢・--- */}
      <div className="card overview-card glass-panel">
        <h2>莉頑律SNS縺ｫ菴ｿ縺｣縺溽ｷ乗凾髢・/h2>
        <div className="huge-time">
          {/* 縺薙％縺ｧformatTime髢｢謨ｰ繧剃ｽｿ縺｣縺ｦ陦ｨ遉ｺ */}
          {formatTime(dashboardData.totalTimeSeconds)}
        </div>
      </div>

      {/* --- 2縺､逶ｮ縺ｮ繧ｫ繝ｼ繝会ｼ壼､ｱ縺｣縺溘♀驥代・萓｡蛟､腸 --- */}
      <div className="card conversion-card glass-panel">
        <h2>螟ｱ縺｣縺溯ｳ・肇 (莉ｮ螳壽凾邨ｦ謠帷ｮ・</h2>
        {/* 蜀・鋤邂・(toLocaleString()縺ｧ繧ｫ繝ｳ繝槭ｒ蜈･繧後ｋ) */}
        <div className="asset-value jpy">
          - ﾂ･ {dashboardData.assets.jpy.toLocaleString()}
        </div>
        {/* 繝薙ャ繝医さ繧､繝ｳ謠帷ｮ・*/}
        <div className="asset-value btc">
          - {dashboardData.assets.btc} BTC
        </div>
      </div>

      {/* --- 3縺､逶ｮ縺ｮ繧ｫ繝ｼ繝会ｼ壼推SNS縺斐→縺ｮ蜀・ｨｳ繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ繝ｪ繧ｹ繝・--- */}
      <div className="card breakdown-card glass-panel">
        <h2>繧ｵ繧､繝亥挨豸郁ｲｻ譎る俣</h2>
        <ul className="site-list">
          {/* dashboardData.timeData縺ｮ荳ｭ霄ｫ・・outube, x縺ｪ縺ｩ・峨ｒ繝ｫ繝ｼ繝励＠縺ｦ菴懊ｋ */}
          {Object.entries(dashboardData.timeData)
            .filter(([_, time]) => time > 0) // 0遘偵・繧ｵ繧､繝医・陦ｨ遉ｺ縺励↑縺・            .map(([site, time]) => (
              // 蜷・し繧､繝医・陦ｨ遉ｺ陦・              <li key={site} className="site-item">
                {/* 鬆ｭ譁・ｭ励ｒ螟ｧ譁・ｭ励↓縺吶ｋ */}
                <span className="site-name">
                  {site.charAt(0).toUpperCase() + site.slice(1)}
                </span>
                {/* 譎る俣 */}
                <span className="site-time">{formatTime(time)}</span>
              </li>
            ))}

          {/* 繧ゅ＠蜈ｨ驛ｨ0遘偵□縺｣縺溘ｉ縲√％縺ｮ繝｡繝・そ繝ｼ繧ｸ繧貞・縺・*/}
          {Object.values(dashboardData.timeData).every(v => v === 0) && (
            <li className="no-data">縺ｾ縺繝・・繧ｿ縺後≠繧翫∪縺帙ｓ縲ら屮隕門ｯｾ雎｡縺ｮSNS繧帝夢隕ｧ縺吶ｋ縺ｨ縺薙％縺ｫ陦ｨ遉ｺ縺輔ｌ縺ｾ縺吶・/li>
          )}
        </ul>
      </div>

      {/* 送 縺薙％縺九ｉ荳九・縺薙・逕ｻ髱｢縺縺代〒菴ｿ縺・ｰら畑縺ｮCSS・医ョ繧ｶ繧､繝ｳ繝ｫ繝ｼ繝ｫ・峨〒縺・*/}
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
