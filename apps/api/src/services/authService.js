/**
 * 認証関連のサービス層
 * Supabase Auth を使用してユーザー認証を管理
 */
const { supabase } = require('../config/supabase');

class AuthService {
  /**
   * メール・パスワードでサインアップ
   */
  async signup(email, password) {
    try {
      // Supabase Auth でユーザーを作成
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      };
    } catch (err) {
      console.error('Signup error:', err.message);
      throw err;
    }
  }

  /**
   * メール・パスワードでログイン
   */
  async login(email, password) {
    try {
      // Supabase Auth でユーザーをログイン
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      };
    } catch (err) {
      console.error('Login error:', err.message);
      throw err;
    }
  }

  /**
   * トークンでユーザー情報を取得
   */
  async getUserFromToken(token) {
    try {
      // アクセストークンからユーザー情報を取得
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        throw new Error('Invalid token');
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.user_metadata?.email || data.user.email,
        },
      };
    } catch (err) {
      console.error('Get user error:', err.message);
      throw err;
    }
  }

  /**
   * パスワードリセットメールを送信
   */
  async sendPasswordResetEmail(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        throw error;
      }

      return { message: 'Password reset email sent' };
    } catch (err) {
      console.error('Password reset error:', err.message);
      throw err;
    }
  }
}

module.exports = new AuthService();
