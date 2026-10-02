import { describe, expect, it } from "vitest";

import {
  averageBookMm,
  compareHeight,
  DEFAULT_BOOK_MM,
  formatCount,
  formatHeight,
  stackProgress,
} from "@/lib/stats/stack";

describe("stackProgress", () => {
  it("高さ 0 なら、一つ下は無く、次は大人の身長", () => {
    const p = stackProgress(0, DEFAULT_BOOK_MM);
    expect(p.below).toBeNull();
    expect(p.next?.name).toBe("大人の身長");
    expect(p.ratioToNext).toBe(0);
    expect(p.booksToNext).toBe(114); // 1,700 mm / 15 mm = 113.3 → 切り上げ
  });

  it("目印ちょうどなら、その目印に届いたとみなし、次は一つ上", () => {
    const p = stackProgress(333_000, DEFAULT_BOOK_MM);
    expect(p.below?.name).toBe("東京タワー");
    expect(p.next?.name).toBe("東京スカイツリー");
    expect(p.booksToNext).toBe(20_067);
  });

  it("あと少しでも、残りは 1 冊", () => {
    expect(stackProgress(384_400_000_000 - 1, DEFAULT_BOOK_MM).booksToNext).toBe(1);
  });

  it("月より高ければ、次の目印は無い", () => {
    const p = stackProgress(384_400_000_001, DEFAULT_BOOK_MM);
    expect(p.below?.name).toBe("地球から月まで");
    expect(p.next).toBeNull();
    expect(p.ratioToNext).toBeNull();
    expect(p.booksToNext).toBeNull();
  });
});

describe("compareHeight", () => {
  it("高さ 0 なら比べない", () => {
    expect(compareHeight(0)).toBeNull();
  });

  it("一番低い目印より低ければ、その目印の何 % か", () => {
    expect(compareHeight(850)).toBe("大人の身長（1.7 m）の 50%");
  });

  it("目印より高ければ、一つ下の目印の何倍か", () => {
    expect(compareHeight(333_000)).toBe("東京タワー（333 m）の 1 倍");
  });
});

describe("formatHeight", () => {
  it.each([
    [56, "5.6 cm"],
    [1234, "1.23 m"],
    [3_776_000, "3,776 m"], // 富士山は m のまま
    [10_000_000, "10 km"],
    [384_400_000_000, "384,400 km"],
  ])("%d mm → %s", (mm, expected) => {
    expect(formatHeight(mm)).toBe(expected);
  });
});

describe("formatCount", () => {
  it("1 万未満はそのまま、1 万以上は省略する", () => {
    expect(formatCount(1234)).toBe("1,234");
    expect(formatCount(22_200)).toBe("2.2万");
    expect(formatCount(25_626_666_667)).toBe("256.3億");
  });
});

describe("averageBookMm", () => {
  it("ページ数が分かる本が無ければ既定の厚さ", () => {
    expect(averageBookMm(0, 0)).toBe(DEFAULT_BOOK_MM);
  });

  it("分かる本の平均", () => {
    expect(averageBookMm(48, 2)).toBe(24);
  });
});
