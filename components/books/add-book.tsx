"use client";

import { useState } from "react";

import { IsbnSearchForm } from "@/components/books/isbn-search-form";
import { ManualBookForm } from "@/components/books/manual-book-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Tab = "isbn" | "manual";

/**
 * 「ISBN で検索」「手動で入力」の 2 タブ。
 * ISBN 検索で見つからなかったときは、その ISBN を引き継いで手動タブへ切り替える。
 */
export function AddBook() {
  const [tab, setTab] = useState<Tab>("isbn");
  const [prefillIsbn, setPrefillIsbn] = useState("");

  function switchToManual(isbn: string) {
    setPrefillIsbn(isbn);
    setTab("manual");
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
      <TabsList>
        <TabsTrigger value="isbn">ISBN で検索</TabsTrigger>
        <TabsTrigger value="manual">手動で入力</TabsTrigger>
      </TabsList>
      <TabsContent value="isbn" className="pt-4">
        <IsbnSearchForm onSwitchToManual={switchToManual} />
      </TabsContent>
      <TabsContent value="manual" className="pt-4">
        {/* key を変えて再マウントし、引き継いだ ISBN を defaultValues に反映する */}
        <ManualBookForm key={prefillIsbn} initialIsbn={prefillIsbn} />
      </TabsContent>
    </Tabs>
  );
}
