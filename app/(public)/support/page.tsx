import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "サポート",
};

/**
 * サポート連絡先（モバイル #37 のストア掲載情報に URL を記載）。
 * TODO: 公開前に連絡先を確定する。
 */
export default function SupportPage() {
  return (
    <>
      <h1>サポート</h1>
      <p>Book Manager に関するお問い合わせ、不具合報告、機能のご要望は以下からお願いします。</p>

      <h2>お問い合わせ</h2>
      <ul>
        <li>
          GitHub Issues:{" "}
          <a
            href="https://github.com/haino357/book_manager/issues"
            target="_blank"
            rel="noreferrer"
          >
            haino357/book_manager
          </a>
        </li>
        <li>メール: TODO（公開前に設定）</li>
      </ul>

      <h2>よくある質問</h2>
      <h3>モバイルアプリのデータを Web に移せますか？</h3>
      <p>
        モバイルアプリのエクスポート機能で JSON を書き出し、Web の「インポート」ページから取り込めます。
      </p>

      <h3>アカウントを削除したい</h3>
      <p>上記の連絡先までご連絡ください。関連する全データを削除します。</p>
    </>
  );
}
