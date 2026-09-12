-- ローカル開発用シード。`supabase db reset` 時に適用される。
-- 書籍マスターのみ投入する（user_books はログインユーザーに依存するため、UI から登録する）。
insert into books (isbn13, isbn10, title, authors, publisher, published_date, categories, source)
values
  ('9784873119694', '4873119698', 'リーダブルコード', array['Dustin Boswell', 'Trevor Foucher'], 'オライリー・ジャパン', '2012-06-23', array['Computers'], 'manual'),
  ('9784297127473', '4297127474', '良いコード/悪いコードで学ぶ設計入門', array['仙塠 大也'], '技術評論社', '2022-04-30', array['Computers'], 'manual')
on conflict (isbn13) do nothing;
