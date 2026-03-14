/**
 * APIサーバーの起動専用ファイル。
 * - `src/app` で組み立てたExpressアプリを読み込む
 * - `env.PORT` で待ち受けを開始する
 *
 * ルーティングや業務ロジックはここに書かず、各レイヤーへ分離する。
 */
const { app } = require('./src/app');
const { env } = require('./src/config/env');

app.listen(env.PORT, () => {
  console.log(`API Server running on http://localhost:${env.PORT}`);
});
