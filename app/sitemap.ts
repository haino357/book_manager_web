import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/** 公開ページだけを載せる */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/support`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
