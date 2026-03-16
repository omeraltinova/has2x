import { ImageResponse } from "next/og";

export const alt = "has2x — AI Usage Multiplier Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: "#fafafa",
              letterSpacing: "-0.02em",
            }}
          >
            has
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 1.15,
              position: "relative",
            }}
          >
            <span style={{ fontSize: 58, fontWeight: 800, color: "#a78bfa", opacity: 0.45, letterSpacing: "-0.02em", transform: "scale(0.95)" }}>
              Codex
            </span>
            <span style={{ fontSize: 88, fontWeight: 800, color: "#fb923c", letterSpacing: "-0.02em" }}>
              Claude
            </span>
            <span style={{ fontSize: 58, fontWeight: 800, color: "#22d3ee", opacity: 0.45, letterSpacing: "-0.02em", transform: "scale(0.95)" }}>
              GLM
            </span>
          </div>
          <span
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: "#34d399",
              letterSpacing: "-0.02em",
            }}
          >
            2x
          </span>
          <span style={{ fontSize: 44, fontWeight: 400, color: "#52525b" }}>
            ?
          </span>
        </div>
        <p
          style={{
            fontSize: 28,
            color: "#71717a",
            margin: 0,
            marginTop: "32px",
          }}
        >
          Real-time AI service usage multiplier tracker
        </p>
      </div>
    ),
    { ...size }
  );
}
