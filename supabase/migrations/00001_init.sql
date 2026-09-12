-- 読書管理 Web MVP — v2 スキーマ + RLS + インデックス
-- 根拠: book-manager-web-mvp-plan.md「データモデル（Supabase PostgreSQL・v2）」
-- モバイル haino357/book_manager の books / reading_histories / book_memos を正とし、ユーザー軸を足した形。

-- ---------------------------------------------------------------------------
-- profiles: auth.users の公開プロフィール拡張
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  is_public boolean default false,
  yearly_goal smallint,                      -- 年間読了目標（統計ダッシュボード用）
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- books: グローバル書籍マスター（ISBN ベースで重複排除）
-- ---------------------------------------------------------------------------
create table books (
  id uuid primary key default gen_random_uuid(),
  isbn13 text unique,                        -- NULL 可（手動登録・ISBN 無し本）。Postgres は NULL の重複を許す
  isbn10 text,
  title text not null,
  authors text[],
  publisher text,
  published_date date,
  cover_url text,
  description text,
  categories text[],                         -- Google Books volumeInfo.categories。ジャンル別グラフの根拠
  source text check (source in ('google_books', 'openbd', 'manual')),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- user_books: ユーザー × 書籍（読書記録の親）
-- ---------------------------------------------------------------------------
create table user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  status text not null check (status in ('wishlist', 'unread', 'reading', 'completed')),
                                             -- wishlist = #52 欲しい本、unread = #34 積読、残りはモバイルと同名
  rating smallint check (rating between 1 and 5),   -- #16 星評価。モバイルは後追い
  started_at date,
  completed_at date,                         -- モバイルの列名 completed_at に合わせる
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, book_id)
);

-- ---------------------------------------------------------------------------
-- reading_histories: 再読履歴（1 回の読書 = 1 行）
-- ---------------------------------------------------------------------------
create table reading_histories (
  id uuid primary key default gen_random_uuid(),
  user_book_id uuid not null references user_books(id) on delete cascade,
  started_at date,
  completed_at date,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- book_memos: メモ（6 種別）。Markdown 本文
-- ---------------------------------------------------------------------------
create table book_memos (
  id uuid primary key default gen_random_uuid(),
  user_book_id uuid not null references user_books(id) on delete cascade,
  type text not null check (type in ('note', 'quote', 'summary', 'review', 'vocabulary', 'action')),
  content text not null,                     -- Markdown
  page int,
  section text,
  is_completed boolean,                      -- type = 'action' の TODO 完了フラグ
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- updated_at 自動更新
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_books_set_updated_at
  before update on user_books
  for each row execute function set_updated_at();

create trigger book_memos_set_updated_at
  before update on book_memos
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- サインアップ時に profiles 行を自動作成
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- インデックス
-- ---------------------------------------------------------------------------
create index user_books_user_status_idx    on user_books (user_id, status);          -- ステータス別一覧
create index user_books_user_completed_idx on user_books (user_id, completed_at);    -- 月次統計
create index book_memos_user_book_type_idx on book_memos (user_book_id, type);       -- 詳細画面の種別タブ
create index reading_histories_user_book_idx on reading_histories (user_book_id);
-- books (isbn13) は unique 制約で自動的にインデックスされる

-- ---------------------------------------------------------------------------
-- RLS 有効化
-- ---------------------------------------------------------------------------
alter table profiles          enable row level security;
alter table books             enable row level security;
alter table user_books        enable row level security;
alter table reading_histories enable row level security;
alter table book_memos        enable row level security;

-- profiles: 自分の行は読み書き可、公開プロフィールは誰でも読める
create policy "own profile rw"      on profiles for all    using (auth.uid() = id) with check (auth.uid() = id);
create policy "public profile read" on profiles for select using (is_public = true);

-- books: 全員読める、認証ユーザーは追加可能
create policy "books read all"      on books for select using (true);
create policy "books insert authed" on books for insert with check (auth.role() = 'authenticated');

-- user_books: 自分の行のみ
create policy "own user_books all" on user_books for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 子テーブル: 親 user_books の所有者のみ
create policy "own histories all" on reading_histories for all
  using (
    exists (select 1 from user_books ub where ub.id = user_book_id and ub.user_id = auth.uid())
  )
  with check (
    exists (select 1 from user_books ub where ub.id = user_book_id and ub.user_id = auth.uid())
  );

create policy "own memos all" on book_memos for all
  using (
    exists (select 1 from user_books ub where ub.id = user_book_id and ub.user_id = auth.uid())
  )
  with check (
    exists (select 1 from user_books ub where ub.id = user_book_id and ub.user_id = auth.uid())
  );
