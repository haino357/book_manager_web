-- 00006: アカウント削除（退会, #34）
-- auth.users の削除にはサービスロールが要るので、security definer の RPC で自分の行だけを消す。
-- profiles / user_books は auth.users を on delete cascade で参照し、
-- reading_histories / book_memos は user_books を on delete cascade で参照しているので一緒に消える。
-- books（共有マスター）はユーザーに紐付かないので残る。

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

-- 既定では public に execute が付くので外し、ログイン中のユーザーだけに許す
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
