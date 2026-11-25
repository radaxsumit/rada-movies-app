import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { verdicts } from "@/config/verdicts";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const verdictHex: Record<string, string> = {
  skip: "#e5484d",
  one_time: "#f5b83d",
  must_watch: "#3dbb72",
  masterpiece: "#a77bf0",
};

/** Default share card for pages without their own image (home, lists, profiles…). */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "radial-gradient(circle at 85% 15%, #3a1d1a 0%, #0b0a16 55%)",
        color: "#f6f5fb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 72, height: 56, borderRadius: 16, background: "#f1533a", display: "flex" }} />
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: 2 }}>
          {site.shortName}
          <span style={{ color: "#f1533a", marginLeft: 12 }}>MOVIES</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>{site.tagline}</div>
        <div style={{ display: "flex", gap: 14 }}>
          {verdicts.map((v) => (
            <div
              key={v.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 22px",
                borderRadius: 999,
                border: `2px solid ${verdictHex[v.id]}`,
                color: verdictHex[v.id],
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {v.label}
            </div>
          ))}
        </div>
      </div>
    </div>,
    size,
  );
}
