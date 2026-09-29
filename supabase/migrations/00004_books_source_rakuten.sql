-- books.source に 'rakuten'（楽天ブックス書籍検索 API）を追加（#27）。
-- 書籍データは Amazon ではなく楽天などの公式 API から取得する。

alter table books drop constraint if exists books_source_check;
alter table books
  add constraint books_source_check
  check (source in ('google_books', 'openbd', 'ndl', 'rakuten', 'manual'));
