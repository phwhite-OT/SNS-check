import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/signup
 * 新規ユーザー登録（Supabase 直接接続）
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

    if (password.length < 6) {
      return Response.json(
        { error: 'パスワードは6文字以上である必要があります' },
        { status: 400 }
      );
    }

    // Supabase クライアント初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Supabase Auth でユーザーを作成
    const { data, error } = await supabase.auth.signUpWithPassword({
      email,
      password,
    });

    if (error) {
      return Response.json(
        { error: error.message || 'サインアップに失敗しました' },
        { status: 400 }
      );
    }

    return Response.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json(
      { error: 'エラーが発生しました: ' + error.message },
      { status: 500 }
    );
  }
}
