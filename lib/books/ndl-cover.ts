/**
 * 国立国会図書館サーチの書影 API（#27）。出版情報登録センター（JPRO）の書影を ISBN-13 で返す。
 * https://iss.ndl.go.jp/information/api/thumbnail_info/
 *
 * 非営利なら申請不要、営利目的（アソシエイトのタグや広告を入れるなど）なら申請が必要。
 * 書影は差し替わることがあるので、長くキャッシュしすぎない（fetch の revalidate は 7 日）。
 */
export function ndlCoverUrl(isbn13: string): string {
  return `https://ndlsearch.ndl.go.jp/thumbnail/${isbn13}.jpg`;
}

/** これより小さい画像は書影ではないとみなす（ダミー画像対策） */
const MIN_COVER_BYTES = 1000;

/** 書影があれば URL、無ければ null（書影が無い ISBN は 404 になる） */
export async function resolveNdlCover(isbn13: string): Promise<string | null> {
  if (!/^\d{13}$/.test(isbn13)) return null;
  const url = ndlCoverUrl(isbn13);
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 7 } }).catch(() => null);
  if (!res?.ok) return null;
  if (!res.headers.get("content-type")?.startsWith("image/")) return null;
  const buf = await res.arrayBuffer();
  return buf.byteLength >= MIN_COVER_BYTES ? url : null;
}
