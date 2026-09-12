"use server";

// M2 で実装: 6 種別メモの CRUD
// - createMemo(userBookId, { type, content, page, section })
// - updateMemo(memoId, patch)
// - toggleActionCompleted(memoId)         type = 'action' の完了トグル
// - deleteMemo(memoId)
// 変更後は revalidatePath(`/books/${userBookId}`) を呼ぶ。

export {};
