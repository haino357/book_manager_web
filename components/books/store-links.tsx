import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { StoreLink } from "@/lib/books/store-links";

/** Amazon・楽天ブックス・カーリルへのリンク（#28）。新しいタブで開く */
export function StoreLinks({ links }: { links: StoreLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Button key={link.id} asChild variant="outline" size="sm">
          <a
            href={link.url}
            target="_blank"
            rel={link.sponsored ? "noopener noreferrer sponsored" : "noopener noreferrer"}
          >
            {link.label}
            <ExternalLinkIcon aria-hidden />
            <span className="sr-only">（新しいタブで開く）</span>
          </a>
        </Button>
      ))}
    </div>
  );
}
