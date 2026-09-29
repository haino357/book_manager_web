/** JST の今日を YYYY-MM-DD で返す（date 列用） */
export function todayJst(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
}

/** date 列（YYYY-MM-DD）を YYYY/MM/DD で表示 */
export const formatDate = (d: string) => d.replaceAll("-", "/");
