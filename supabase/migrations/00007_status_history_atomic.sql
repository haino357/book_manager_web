-- 00007: 読了ステータスと読書履歴を一つのトランザクションで保存する（#47）
-- これまでは user_books の更新と reading_histories の追加を別々に送っていたため、
-- 履歴だけ失敗するとステータスは completed のまま履歴が無くなり、同時に読了にすると履歴が 2 件できた。
-- どの関数も security invoker（既定）なので RLS がそのまま効き、自分の本しか書き換えられない。
-- 日付の決め方はアプリ側（lib/books/status.ts）に置き、ここでは渡された値を書くだけにする。

-- ---------------------------------------------------------------------------
-- change_user_book_status: ステータスと日付を更新し、completed になったら履歴を 1 行足す
-- p_from_status はアプリが読んだときのステータス。いまの値と違えば（別の画面で先に変わった）
-- 何もせず false を返す。update の行ロックで同時の呼び出しは順番に処理されるので、
-- 同じ遷移で履歴が 2 件できることはない。
-- ---------------------------------------------------------------------------
create or replace function public.change_user_book_status(
  p_user_book_id uuid,
  p_from_status text,
  p_to_status text,
  p_started_at date default null,
  p_completed_at date default null
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  update public.user_books
     set status = p_to_status,
         started_at = p_started_at,
         completed_at = p_completed_at
   where id = p_user_book_id
     and status = p_from_status;
  if not found then
    return false;
  end if;

  if p_to_status = 'completed' and p_from_status <> 'completed' then
    insert into public.reading_histories (user_book_id, started_at, completed_at)
    values (p_user_book_id, p_started_at, p_completed_at);
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- add_user_book: 本棚に追加し、completed で登録したら履歴も 1 行足す
-- unique (user_id, book_id) 違反は 23505 のまま返す（アプリ側で「登録済み」にする）
-- ---------------------------------------------------------------------------
create or replace function public.add_user_book(
  p_book_id uuid,
  p_status text,
  p_started_at date default null,
  p_completed_at date default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.user_books (user_id, book_id, status, started_at, completed_at)
  values (auth.uid(), p_book_id, p_status, p_started_at, p_completed_at)
  returning id into v_id;

  if p_status = 'completed' then
    insert into public.reading_histories (user_book_id, started_at, completed_at)
    values (v_id, p_started_at, p_completed_at);
  end if;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- update_reading_dates: 開始日・読了日を直し、読了済みなら最新の履歴（今回の読書）にも写す
-- 本が見つからなければ false
-- ---------------------------------------------------------------------------
create or replace function public.update_reading_dates(
  p_user_book_id uuid,
  p_started_at date default null,
  p_completed_at date default null
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_status text;
begin
  update public.user_books
     set started_at = p_started_at,
         completed_at = p_completed_at
   where id = p_user_book_id
  returning status into v_status;
  if not found then
    return false;
  end if;

  if v_status = 'completed' then
    update public.reading_histories
       set started_at = p_started_at,
           completed_at = p_completed_at
     where id = (
       select h.id
         from public.reading_histories h
        where h.user_book_id = p_user_book_id
        order by h.created_at desc
        limit 1
     );
  end if;
  return true;
end;
$$;

revoke all on function public.change_user_book_status(uuid, text, text, date, date) from public, anon;
revoke all on function public.add_user_book(uuid, text, date, date) from public, anon;
revoke all on function public.update_reading_dates(uuid, date, date) from public, anon;
grant execute on function public.change_user_book_status(uuid, text, text, date, date) to authenticated;
grant execute on function public.add_user_book(uuid, text, date, date) to authenticated;
grant execute on function public.update_reading_dates(uuid, date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- これまでの不具合で、completed なのに履歴が 1 件も無い本に、今の日付で履歴を足す
-- ---------------------------------------------------------------------------
insert into public.reading_histories (user_book_id, started_at, completed_at)
select ub.id, ub.started_at, ub.completed_at
  from public.user_books ub
 where ub.status = 'completed'
   and not exists (
     select 1 from public.reading_histories h where h.user_book_id = ub.id
   );
