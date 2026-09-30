import type { Metadata } from "next";

import { NewPasswordForm } from "@/components/auth/new-password-form";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "設定" };

/** アカウントの設定: パスワードの変更（#33）と退会（#34） */
export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Google だけで登録した人はパスワードを持たないが、ここで設定すればメールでもログインできるようになる
  const hasPassword = user?.identities?.some((i) => i.provider === "email") ?? false;

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-bold">設定</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">アカウント</h2>
        <p className="text-sm text-muted-foreground">メールアドレス: {user?.email}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {hasPassword ? "パスワードの変更" : "パスワードの設定"}
        </h2>
        {!hasPassword && (
          <p className="text-sm text-muted-foreground">
            Google アカウントで登録しています。パスワードを設定すると、メールアドレスでもログインできます。
          </p>
        )}
        <NewPasswordForm submitLabel={hasPassword ? "パスワードを変更する" : "パスワードを設定する"} />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-destructive">アカウントの削除</h2>
        <p className="text-sm text-muted-foreground">
          アカウントと、登録した本・評価・メモ・読書履歴をすべて削除します。削除したデータは復元できません。
        </p>
        <DeleteAccountDialog />
      </section>
    </div>
  );
}
