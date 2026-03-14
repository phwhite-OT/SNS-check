/**
 * POST /api/auth/logout
 * ログアウト
 */
export async function POST(request) {
  const res = Response.json(
    { message: 'ログアウトしました' },
    { status: 200 }
  );

  // クッキーをクリア
  res.cookies.delete('supabase-token');
  res.cookies.delete('user-id');

  return res;
}
