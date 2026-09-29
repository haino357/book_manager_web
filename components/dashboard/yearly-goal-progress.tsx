import { YearlyGoalDialog } from "@/components/dashboard/yearly-goal-dialog";

type Props = {
  year: number;
  completed: number;
  goal: number | null;
};

/**
 * 今年の読了数 / 年間目標（#14）。目標が未設定なら設定を促す。
 * メーターの未達部分は同じ青の薄い段（--viz-track）にして、達成度が帯全体で読めるようにする。
 */
export function YearlyGoalProgress({ year, completed, goal }: Props) {
  const ratio = goal ? Math.min(1, completed / goal) : 0;
  const percent = goal ? Math.round((completed / goal) * 100) : null;

  return (
    <section className="space-y-4 rounded-xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">{year} 年の読了</h2>
          <p className="mt-1 text-5xl font-semibold leading-none">
            {completed}
            <span className="ml-1 text-lg font-normal text-muted-foreground">
              {goal ? ` / ${goal} 冊` : " 冊"}
            </span>
          </p>
        </div>
        <YearlyGoalDialog goal={goal} year={year} />
      </div>

      {goal ? (
        <div className="space-y-1.5">
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-viz-track"
            role="meter"
            aria-label="年間目標の達成度"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={completed}
          >
            <div className="h-full rounded-full bg-viz-series" style={{ width: `${ratio * 100}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">
            {completed >= goal
              ? `目標達成（${percent}%）`
              : `達成率 ${percent}% ・ あと ${goal - completed} 冊`}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          年間の読了目標を設定すると、ここに進み具合が表示されます。
        </p>
      )}
    </section>
  );
}
