import type { Landmark } from "@/lib/stats/stack";

/** 目印を見分けるための図。高さの縮尺は隣接する比較グラフで表す。 */
export function LandmarkIllustration({ landmark }: { landmark: Landmark }) {
  let drawing: React.ReactNode;
  switch (landmark.name) {
    case "大人の身長":
      drawing = <><circle cx="40" cy="12" r="7" /><path d="M32 24h16l7 22-6 2-6-17v18l5 24h-8l-3-21-3 21h-8l5-26V31l-6 17-6-2 7-22Z" /></>;
      break;
    case "キリン":
      drawing = <><path d="m18 72 2-30 26-3 8-27 15-3 5 5-14 6-6 30-2 22h-5l-2-21H28l-4 21Z" /><path d="m20 42-7 9m44-38-2-8m9 5 1-6" fill="none" /><path d="m28 45 5 3m9-5 4 3m8-21 4 2m-7 7 4 2" className="stroke-background" /></>;
      break;
    case "奈良の大仏":
      drawing = <><path d="M12 68h56v6H12zM24 61q-11-3-11-11l17-10h20l17 10q0 8-11 11Z" /><circle cx="40" cy="19" r="10" /><path d="M30 29h20l7 26H23Z" /><path d="m29 44 7 7h12m-8-35h1m-5 9h8" fill="none" className="stroke-background" /><path d="M33 8q7-8 14 0" /></>;
      break;
    case "自由の女神":
      drawing = <><path d="M23 65h34v9H23zM29 55h22v10H29zM34 28h13l7 27H27l7-27-12-11 4-5 13 15" /><circle cx="40" cy="19" r="6" /><path d="m34 13-3-5 7 2 2-7 3 7 7-2-4 6M22 13l-3-8h9l-2 8M47 30l10 7-6 12-7-5" /><path d="m35 36-3 17m9-21 4 21" className="stroke-background" /></>;
      break;
    case "東京タワー":
      drawing = <><path d="M40 4v10M37 14h6l3 23 17 37H51l-11-20-11 20H17l17-37Z" /><path d="M29 39h22v5H29zM34 25h12v5H34z" /><path d="m33 49 16 12m-2-12L31 61M37 19l6 15m-6 0 6-15" className="stroke-background" fill="none" /></>;
      break;
    case "東京スカイツリー":
      drawing = <><path d="M40 3v19M37 22h6v16l3 36H34l3-36Z" /><path d="M33 23h14l-3 7h-8zM30 37h20l-5 9H35Z" /><path d="m37 50 6 16m0-16-6 16" className="stroke-background" /></>;
      break;
    case "富士山":
      drawing = <><path d="M4 69 33 27h14l29 42Z" /><path d="m24 41 9-14h14l10 15-10-5-7 5-8-5Z" className="fill-background" stroke="none" /></>;
      break;
    case "エベレスト":
      drawing = <><path d="m3 69 19-29 9 8 16-33 30 54Z" /><path d="m38 34 9-19 12 21-10-6-5 8Z" className="fill-background" stroke="none" /><path d="m22 40 7 29m18-36 9 36" fill="none" className="stroke-background" /></>;
      break;
    case "旅客機が飛ぶ高さ":
      drawing = <><path d="m7 39 27-5L29 8l7-2 14 25 17-3q10-1 10 4t-10 6l-16 3-8 29-7 2 1-28-22 4-8-9Z" /><path d="M4 58h18M53 59h22" fill="none" /></>;
      break;
    case "宇宙との境目":
      drawing = <><path d="M5 69q35-31 70 0" fill="none" /><path d="M5 45h70" strokeDasharray="4 5" fill="none" /><path d="M40 36V14m-6 6 6-6 6 6M16 13v8m-4-4h8m41 10v8m-4-4h8" fill="none" /></>;
      break;
    case "国際宇宙ステーション":
      drawing = <g transform="rotate(-25 40 40)"><path d="M9 21h15v38H9zM56 21h15v38H56zM32 34h16v12H32z" /><path d="M24 40h8m16 0h8M40 26v28" fill="none" /><path d="M9 33h15M9 47h15m32-14h15M56 47h15" className="stroke-background" /></g>;
      break;
    default:
      drawing = <><circle cx="40" cy="40" r="29" /><g className="fill-background/60" stroke="none"><circle cx="31" cy="26" r="7" /><circle cx="52" cy="43" r="9" /><circle cx="29" cy="53" r="5" /></g></>;
  }
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="h-16 w-16 text-muted-foreground" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      {drawing}
    </svg>
  );
}
