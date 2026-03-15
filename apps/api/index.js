/**
 * APIサーバーの起動専用ファイル。
 * - `src/app` で組み立てたExpressアプリを読み込む
 * - 127.0.0.1:3001 の内部ポートで待ち受けを開始する
 *
 * ルーティングや業務ロジックはここに書かず、各レイヤーへ分離する。
 */
const { app } = require('./src/app');

const INTERNAL_PORT = process.env.PORT || 3001;
const INTERNAL_HOST = '0.0.0.0';

app.listen(INTERNAL_PORT, INTERNAL_HOST, () => {
  console.log(`API Server running on http://${INTERNAL_HOST}:${INTERNAL_PORT}`);
});
