import { describe, expect, it } from "vitest";

import { statusTransitionPatch } from "@/lib/books/status";

const TODAY = "2026-10-08";

describe("statusTransitionPatch", () => {
  it("未読 → 読書中: 開始日が空なら今日", () => {
    expect(
      statusTransitionPatch({ status: "unread", started_at: null, completed_at: null }, "reading", TODAY),
    ).toEqual({ started_at: TODAY });
  });

  it("読書中に戻す: 開始日が入っていれば残す", () => {
    expect(
      statusTransitionPatch(
        { status: "unread", started_at: "2026-09-01", completed_at: null },
        "reading",
        TODAY,
      ),
    ).toEqual({ started_at: "2026-09-01" });
  });

  it("読了 → 読書中（再読）: 開始日を今日にし、読了日を消す", () => {
    expect(
      statusTransitionPatch(
        { status: "completed", started_at: "2026-01-10", completed_at: "2026-02-01" },
        "reading",
        TODAY,
      ),
    ).toEqual({ started_at: TODAY, completed_at: null });
  });

  it("読書中 → 読了: 読了日を今日にし、開始日は触らない", () => {
    expect(
      statusTransitionPatch(
        { status: "reading", started_at: "2026-09-01", completed_at: null },
        "completed",
        TODAY,
      ),
    ).toEqual({ completed_at: TODAY });
  });

  it("未読から直接読了: 開始日は空のまま", () => {
    const current = { status: "unread" as const, started_at: null, completed_at: null };
    expect({ ...current, ...statusTransitionPatch(current, "completed", TODAY) }).toEqual({
      status: "unread",
      started_at: null,
      completed_at: TODAY,
    });
  });

  it.each(["wishlist", "unread"] as const)("→ %s: 日付は触らない", (next) => {
    expect(
      statusTransitionPatch(
        { status: "completed", started_at: "2026-01-10", completed_at: "2026-02-01" },
        next,
        TODAY,
      ),
    ).toEqual({});
  });
});
