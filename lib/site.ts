/** サイトの名前と URL。metadata・robots・sitemap・メールのリダイレクト先で使う */
export const SITE_NAME = "Book Manager";

export const SITE_DESCRIPTION =
  "蔵書の登録、読書ステータスの管理、メモ、統計ダッシュボード。モバイルアプリとデータを共有する読書管理 Web です。";

/** 末尾のスラッシュを除いた NEXT_PUBLIC_SITE_URL。未設定ならローカル */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * 問い合わせ用メールアドレス（/support /privacy /terms に出す）。
 * 未設定のときはメールの行を出さず、GitHub Issues だけを案内する。
 */
export function supportEmail(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || undefined;
}
