import { z } from "zod";

/** profiles.yearly_goal（smallint）。null は未設定 */
export const yearlyGoalSchema = z
  .number({ invalid_type_error: "冊数を数字で入力してください" })
  .int("冊数は整数で入力してください")
  .min(1, "1 冊以上で入力してください")
  .max(1000, "1,000 冊以下で入力してください")
  .nullable();
