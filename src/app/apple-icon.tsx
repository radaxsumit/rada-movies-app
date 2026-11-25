import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS / the PWA manifest (same mark as icon.svg). */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0a16",
      }}
    >
      <svg width="132" height="132" viewBox="0 0 32 32">
        <rect x="2" y="5" width="28" height="22" rx="6" fill="#f1533a" />
        <g fill="#0b0a16">
          <rect x="5" y="8" width="3" height="3" rx="1" />
          <rect x="5" y="14.5" width="3" height="3" rx="1" />
          <rect x="5" y="21" width="3" height="3" rx="1" />
          <rect x="24" y="8" width="3" height="3" rx="1" />
          <rect x="24" y="14.5" width="3" height="3" rx="1" />
          <rect x="24" y="21" width="3" height="3" rx="1" />
          <path d="M13 11.2v9.6a.8.8 0 0 0 1.2.7l7.6-4.8a.8.8 0 0 0 0-1.4l-7.6-4.8a.8.8 0 0 0-1.2.7Z" />
        </g>
      </svg>
    </div>,
    size,
  );
}
