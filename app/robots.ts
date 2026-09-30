import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/** ログイン後の画面と API はクロールさせない */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/books", "/dashboard", "/import", "/settings", "/reset-password", "/api/", "/auth/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
