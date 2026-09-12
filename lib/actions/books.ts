"use server";

// M2 で実装: 蔵書の登録・ステータス遷移・評価
// - createUserBook(metadata, status)      books を upsert（isbn13 で重複排除）→ user_books を insert
// - updateStatus(userBookId, status)      reading → started_at、completed → completed_at + reading_histories 追加
// - updateRating(userBookId, rating)      M3
// 変更後は revalidatePath("/books") を呼ぶ。

export {};
