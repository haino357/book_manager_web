-- books.source に 'ndl'（国立国会図書館サーチ）を追加。
-- キーワード検索は Google Books → NDL サーチのフォールバックで取得するため、出自として記録できるようにする。

alter table books drop constraint if exists books_source_check;
alter table books
  add constraint books_source_check
  check (source in ('google_books', 'openbd', 'ndl', 'manual'));
