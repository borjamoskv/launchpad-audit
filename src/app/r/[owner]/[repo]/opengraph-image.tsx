import { ImageResponse } from "next/og";
import { getScoreBadgeColor } from "@/lib/badge";
import { loadPublicRepoReport } from "@/lib/public-report";

export const alt = "Launchpad Audit repository score";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

interface OpenGraphImageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
};

const metricBox = (label: string, value: string) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: "18px 22px",
      borderRadius: 28,
      background: "rgba(255,255,255,0.1)",
      border: "1px solid rgba(255,255,255,0.16)",
      minWidth: 170,
    }}
  >
    <div style={{ display: "flex", fontSize: 22, color: "#a7f3d0", fontWeight: 800 }}>{label}</div>
    <div style={{ display: "flex", fontSize: 42, color: "#ffffff", fontWeight: 900 }}>{value}</div>
  </div>
);

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { owner, repo } = await params;
  const result = await loadPublicRepoReport(owner, repo);

  if (!result.ok) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 72,
            background: "linear-gradient(135deg, #0f172a 0%, #172554 52%, #7f1d1d 100%)",
            color: "white",
            fontFamily: "Arial",
          }}
        >
          <div style={{ display: "flex", fontSize: 34, color: "#fca5a5", fontWeight: 800 }}>Launchpad Audit</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 84, fontWeight: 900 }}>Repo no disponible</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#e2e8f0" }}>{result.error}</div>
        </div>
      ),
      size,
    );
  }

  const { report } = result;
  const scoreColor = getScoreBadgeColor(report.score, report.maxScore);
  const topAction = report.actions[0]?.title ?? "Listo para distribución";
  const secondAction = report.actions[1]?.title ?? "Medir feedback semanal";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #031c18 0%, #0f172a 50%, #431407 100%)",
          color: "white",
          fontFamily: "Arial",
          padding: 64,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            display: "flex",
            borderRadius: 999,
            background: "rgba(16,185,129,0.22)",
            left: -120,
            top: -160,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            display: "flex",
            borderRadius: 999,
            background: "rgba(251,146,60,0.22)",
            right: -80,
            bottom: -120,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "#a7f3d0",
                fontWeight: 900,
              }}
            >
              Launchpad Audit
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 22px",
                borderRadius: 999,
                background: "rgba(15,23,42,0.72)",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
            >
              <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, background: scoreColor }} />
              <div style={{ display: "flex", fontSize: 28, fontWeight: 900 }}>{`${report.score}/${report.maxScore}`}</div>
            </div>
          </div>

          <div style={{ marginTop: 50, display: "flex", justifyContent: "space-between", gap: 42 }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", fontSize: 78, lineHeight: 0.95, fontWeight: 900, letterSpacing: -3 }}>
                {report.metrics.fullName}
              </div>
              <div style={{ display: "flex", marginTop: 22, fontSize: 30, lineHeight: 1.35, color: "#dbeafe" }}>
                {report.summary}
              </div>
            </div>
            <div
              style={{
                width: 250,
                height: 250,
                borderRadius: 999,
                border: "18px solid rgba(255,255,255,0.12)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: scoreColor,
                boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ display: "flex", fontSize: 82, fontWeight: 900, lineHeight: 0.9 }}>{report.score}</div>
              <div style={{ display: "flex", marginTop: 8, fontSize: 24, fontWeight: 800 }}>SCORE</div>
            </div>
          </div>

          <div style={{ marginTop: 42, display: "flex", gap: 18 }}>
            {metricBox("Stars", formatNumber(report.metrics.stars))}
            {metricBox("Forks", formatNumber(report.metrics.forks))}
            {metricBox("Issues", formatNumber(report.metrics.openIssues))}
          </div>

          <div
            style={{
              marginTop: 34,
              display: "flex",
              gap: 18,
              fontSize: 25,
              color: "#fed7aa",
              fontWeight: 800,
            }}
          >
            <div style={{ display: "flex" }}>Next moves:</div>
            <div style={{ display: "flex" }}>{topAction}</div>
            <div style={{ display: "flex", color: "#94a3b8" }}>+</div>
            <div style={{ display: "flex" }}>{secondAction}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
