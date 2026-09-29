import { Skeleton } from "@/components/ui/skeleton";

/** 蔵書一覧のローディング。タブ切替（searchParams の変更）でも表示される */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy aria-label="読み込み中">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-9 w-80 max-w-full" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex gap-3 rounded-lg border p-3">
            <Skeleton className="aspect-[2/3] w-16 shrink-0" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-auto h-5 w-14 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
