-- ローカル開発用シード。`supabase db reset` 時に適用される。
-- 書籍マスターのみ投入する（user_books はログインユーザーに依存するため、UI から登録する）。
insert into books (isbn13, isbn10, title, authors, publisher, published_date, categories, source)
values
  ('9784873115658', '4873115655', 'リーダブルコード', array['Dustin Boswell', 'Trevor Foucher'], 'オライリー・ジャパン', '2012-06-23', array['Computers'], 'manual'),
  ('9784297127831', '4297127830', '良いコード/悪いコードで学ぶ設計入門', array['仙塲大也'], '技術評論社', '2022-04-30', array['Computers'], 'manual')
on conflict (isbn13) do nothing;
