import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/signup
 * 新規ユーザー登録（Supabase 直接接続）
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードが必要です' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'サインアップに失敗しました' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'エラーが発生しました: ' + error.message },
      { status: 500 }
    );
  }
}
