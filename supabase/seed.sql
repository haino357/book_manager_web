-- ローカル開発用シード。`supabase db reset` 時に適用される。
-- 書籍マスターのみ投入する（user_books はログインユーザーに依存するため、UI から登録する）。
-- page_count / list_price（税抜）は統計ダッシュボードの確認用。
insert into books (isbn13, isbn10, title, authors, publisher, published_date, categories, page_count, list_price, source)
values
  ('9784873115658', '4873115655', 'リーダブルコード', array['Dustin Boswell', 'Trevor Foucher'], 'オライリー・ジャパン', '2012-06-23', array['Computers'], 260, 2400, 'manual'),
  ('9784297127831', '4297127830', '良いコード/悪いコードで学ぶ設計入門', array['仙塲大也'], '技術評論社', '2022-04-30', array['Computers'], 408, 2980, 'manual')
on conflict (isbn13) do nothing;
