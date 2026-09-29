type Props = {
  label: string;
  value: string;
  /** 値の下の補足（冊数・不明件数など） */
  note?: string;
};

/** 数値 1 つを見せるタイル（金額・ページ数など） */
export function StatTile({ label, value, note }: Props) {
  return (
    <div className="space-y-1 rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
