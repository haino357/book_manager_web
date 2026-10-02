import type { Metadata } from "next";
import Link from "next/link";

import { supportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "サポート",
};

/** サポート連絡先（モバイル #37 のストア掲載情報に URL を記載） */
export default function SupportPage() {
  const email = supportEmail();

  return (
    <>
      <h1>サポート</h1>
      <p>Book Manager に関するお問い合わせ、不具合報告、機能のご要望は以下からお願いします。</p>

      <h2>お問い合わせ</h2>
      <ul>
        {email && (
          <li>
            メール: <a href={`mailto:${email}`}>{email}</a>
          </li>
        )}
        <li>
          GitHub Issues:{" "}
          <a
            href="https://github.com/haino357/book_manager/issues"
            target="_blank"
            rel="noreferrer"
          >
            haino357/book_manager
          </a>
          （公開されるので、メールアドレスなどの個人情報は書かないでください）
        </li>
      </ul>

      <h2>よくある質問</h2>
      <h3>パスワードを忘れました</h3>
      <p>
        <Link href="/forgot-password">パスワードの再設定</Link>
        から、登録したメールアドレスに再設定のリンクを送れます。
      </p>

      <h3>モバイルアプリのデータを Web に移せますか？</h3>
      <p>
        モバイルアプリのエクスポート機能で JSON を書き出し、Web の「インポート」ページから取り込めます。
      </p>

      <h3>アカウントを削除したい</h3>
      <p>
        ログイン後、画面上部の「設定」→「アカウントを削除」から削除できます。
        確認のため「削除」と入力すると、アカウントと、登録した本・評価・メモ・読書履歴がすべて削除されます。削除したデータは元に戻せません。
        モバイルアプリも同じアカウントを使っているので、モバイルのデータも削除されます。
      </p>
      <p>
        ログインできないなどの理由で画面から削除できない場合は、上記のお問い合わせ先までご連絡ください。
      </p>
    </>
  );
}
