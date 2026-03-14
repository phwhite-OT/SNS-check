import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/login
 * メールアドレスとパスワードでログイン
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: 'メールアドレスとパスワードが必要です' },
        { status: 400 }
      );
    }

    // Supabase クライアント初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Supabase Auth でログイン
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return Response.json(
        { error: error.message || 'ログインに失敗しました' },
        { status: 401 }
      );
    }

    // セッションをクッキーに保存
    const res = Response.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      },
    });

    // セッショントークンをクッキーに保存
    if (data.session?.access_token) {
      res.cookies.set('supabase-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    // ユーザー ID をクッキーに保存
    if (data.user?.id) {
      res.cookies.set('user-id', data.user.id, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'エラーが発生しました: ' + error.message },
      { status: 500 }
    );
  }
}
