/**
 * 認証関連のコントローラー
 */
const authService = require('../services/authService');
const { HttpError } = require('../utils/httpError');

/**
 * POST /api/auth/signup
 * ユーザー登録
 */
const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new HttpError(400, 'メールアドレスとパスワードが必要です');
    }

    if (password.length < 6) {
      throw new HttpError(400, 'パスワードは6文字以上である必要があります');
    }

    const result = await authService.signup(email, password);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * ログイン
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new HttpError(400, 'メールアドレスとパスワードが必要です');
    }

    const result = await authService.login(email, password);

    res.json(result);
  } catch (err) {
    // Supabase が返すエラーを適切にハンドル
    if (err.message.includes('Invalid login credentials')) {
      return next(new HttpError(401, 'メールアドレスまたはパスワードが間違っています'));
    }
    if (err.message.includes('User already registered')) {
      return next(new HttpError(409, 'このメールアドレスは既に登録されています'));
    }
    next(err);
  }
};

/**
 * GET /api/auth/me
 * 現在のユーザー情報取得（トークン検証）
 */
const getMe = async (req, res, next) => {
  try {
    // Authorization ヘッダーからのトークン取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'トークンが見つかりません');
    }

    const token = authHeader.slice(7);
    const result = await authService.getUserFromToken(token);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * ログアウト（サーバー側では特に処理なし、クライアント側でクッキー削除）
 */
const logout = async (req, res) => {
  res.json({ message: 'ログアウトしました' });
};

module.exports = {
  signup,
  login,
  getMe,
  logout,
};
