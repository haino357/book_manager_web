import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
};

/**
 * 自由記述の検索欄。GET /books/search?q=... に遷移するだけの素の form なので Server Component から使える。
 */
export function SearchBox({ defaultValue = "", autoFocus, className }: Props) {
  return (
    <form action="/books/search" method="get" role="search" className={className}>
      <Label htmlFor="q" className="sr-only">
        タイトル・著者で検索
      </Label>
      <div className="flex gap-2">
        <Input
          id="q"
          name="q"
          type="search"
          placeholder="タイトル・著者・キーワード"
          defaultValue={defaultValue}
          autoComplete="off"
          autoFocus={autoFocus}
          required
          minLength={1}
          maxLength={200}
          className="max-w-md"
        />
        <Button type="submit">
          <SearchIcon className="size-4" aria-hidden />
          検索
        </Button>
      </div>
    </form>
  );
}
