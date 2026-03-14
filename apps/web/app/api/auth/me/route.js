import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 * 現在のセッション情報を取得（ログイン状態確認）
 */
export async function GET(request) {
  try {
    const token = request.cookies.get('supabase-token')?.value;
    const userId = request.cookies.get('user-id')?.value;

    if (!token || !userId) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    // Supabase クライアント初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // トークンでユーザー情報を取得
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      // トークンが無効な場合、クッキーをクリア
      const res = NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
      res.cookies.delete('supabase-token');
      res.cookies.delete('user-id');
      return res;
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
}
