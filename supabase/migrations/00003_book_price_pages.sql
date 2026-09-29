-- 統計用: ページ数（#25）と金額（#24）
-- books は共有マスターなので、定価・ページ数は books に、実際に払った額は user_books に持つ。

alter table books add column page_count int check (page_count > 0);
alter table books add column list_price int check (list_price >= 0);  -- 定価（税抜・円）

alter table user_books add column price_paid int check (price_paid >= 0);  -- 実際に払った額（円）。NULL なら list_price で集計

-- ---------------------------------------------------------------------------
-- fill_book_details: 登録済みの books 行の page_count / list_price を「空のときだけ」埋める
-- books には update ポリシーが無い（誰でも書き換えられる形にしない）ため、security definer の関数で
-- 自分の本棚にある本に限り、NULL → 値の変更だけを許す。書影・説明の補完は #21。
-- ---------------------------------------------------------------------------
create or replace function fill_book_details(
  p_book_id uuid,
  p_page_count int default null,
  p_list_price int default null
)
returns void
language sql
security definer
set search_path = public
as $$
  update books
     set page_count = coalesce(page_count, p_page_count),
         list_price = coalesce(list_price, p_list_price)
   where id = p_book_id
     and exists (
       select 1 from user_books ub where ub.book_id = p_book_id and ub.user_id = auth.uid()
     );
$$;

revoke all on function fill_book_details(uuid, int, int) from public, anon;
grant execute on function fill_book_details(uuid, int, int) to authenticated;
