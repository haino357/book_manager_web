import { isbn13To10 } from "./types";

export type StoreLink = {
  id: "amazon" | "rakuten" | "calil";
  label: string;
  url: string;
  /** アフィリエイトのタグ付き（rel="sponsored" を付ける） */
  sponsored: boolean;
};

type BookForLinks = {
  isbn13: string | null;
  isbn10: string | null;
  title: string;
  authors: string[] | null;
};

/**
 * 書籍の商品ページ・図書館検索へのリンク（#28）。
 * Amazon からはデータを取らず、リンクだけを出す（API も使わない）。
 * amazonTag を渡すと Amazon アソシエイトのタグを付ける（その場合はアソシエイトの表示が必要）。
 */
export function buildStoreLinks(book: BookForLinks, amazonTag?: string): StoreLink[] {
  const isbn10 = book.isbn10 ?? (book.isbn13 ? isbn13To10(book.isbn13) : null);
  const keyword = [book.title, book.authors?.[0]].filter(Boolean).join(" ");
  const links: StoreLink[] = [];

  // Amazon: 紙の本は ISBN-10 = ASIN。ISBN-10 が無ければ（979 始まり・ISBN なし）書籍カテゴリで検索
  const amazon = isbn10
    ? new URL(`https://www.amazon.co.jp/dp/${isbn10}`)
    : new URL("https://www.amazon.co.jp/s");
  if (!isbn10) {
    amazon.searchParams.set("k", book.isbn13 ?? keyword);
    amazon.searchParams.set("i", "stripbooks");
  }
  if (amazonTag) amazon.searchParams.set("tag", amazonTag);
  links.push({ id: "amazon", label: "Amazon", url: amazon.toString(), sponsored: !!amazonTag });

  // 楽天ブックス: ISBN（無ければタイトル + 著者）で検索
  const rakuten = new URL("https://books.rakuten.co.jp/search");
  rakuten.searchParams.set("sitem", book.isbn13 ?? keyword);
  links.push({ id: "rakuten", label: "楽天ブックス", url: rakuten.toString(), sponsored: false });

  // カーリル: 近くの図書館の蔵書を探す（ISBN-10 のページ）
  if (isbn10) {
    links.push({
      id: "calil",
      label: "図書館で探す（カーリル）",
      url: `https://calil.jp/book/${isbn10}`,
      sponsored: false,
    });
  }
  return links;
}

/** サーバー側の環境変数から Amazon アソシエイトのタグを読む（未設定なら undefined） */
export function amazonAssociateTag(): string | undefined {
  return process.env.AMAZON_ASSOCIATE_TAG?.trim() || undefined;
}
