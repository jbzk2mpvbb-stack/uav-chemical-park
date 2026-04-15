import { useState, useEffect, useRef, useCallback } from "react";

// Generate smooth curve data with optional anomaly spike
function genData(base, variance, length, anomalyAt, anomalySize) {
  const pts = [];
  let v = base;
  for (let i = 0; i < length; i++) {
    v += (Math.random() - 0.5) * variance;
    v = v * 0.97 + base * 0.03; // drift back to base
    if (anomalyAt && i >= anomalyAt && i < anomalyAt + 8) {
      const spike = Math.sin(((i - anomalyAt) / 8) * Math.PI) * anomalySize;
      pts.push(v + spike);
    } else {
      pts.push(v);
    }
  }
  return pts;
}

const TOTAL_PTS = 120;

// Normal data
const NORMAL = {
  pressure: genData(1.8, 0.04, TOTAL_PTS),
  temp: genData(23, 0.3, TOTAL_PTS),
  flow: genData(120, 1.5, TOTAL_PTS),
  gas: genData(4, 0.3, TOTAL_PTS),
};

// Anomaly data — spikes at different times
const ANOMALY = {
  pressure: genData(1.8, 0.04, TOTAL_PTS, 70, -1.3),
  temp: genData(23, 0.3, TOTAL_PTS, 78, 18),
  flow: genData(120, 1.5, TOTAL_PTS, 65, -85),
  gas: genData(4, 0.3, TOTAL_PTS, 60, 22),
};

const SIGNALS = [
  { key: "pressure", label: "PRESSURE", unit: "MPa", color: "#00e6a0", warnHigh: 2.5, warnLow: 0.8, decimals: 2 },
  { key: "temp", label: "TEMPERATURE", unit: "°C", color: "#0099ff", warnHigh: 38, warnLow: null, decimals: 1 },
  { key: "flow", label: "FLOW RATE", unit: "L/min", color: "#00d4aa", warnHigh: null, warnLow: 50, decimals: 1 },
  { key: "gas", label: "GAS CONC.", unit: "ppm", color: "#a78bfa", warnHigh: 15, warnLow: null, decimals: 1 },
];

const ANOMALY_LOGS = [
  { t: 60, msg: "Gas concentration rising — 4.2 → 8.7 ppm", level: "WARN" },
  { t: 63, msg: "Gas concentration exceeded threshold — 15.3 ppm", level: "ALERT" },
  { t: 65, msg: "Flow rate dropping — 120 → 78 L/min", level: "WARN" },
  { t: 68, msg: "Flow rate critical — 42 L/min", level: "ALERT" },
  { t: 70, msg: "Pressure anomaly — 1.8 → 0.6 MPa in 3s", level: "ALERT" },
  { t: 72, msg: "Pressure-flow mismatch detected — Leak probable", level: "ALERT" },
  { t: 75, msg: "AI Analysis: Multi-signal correlation → LEAK at Node A3", level: "CRITICAL" },
  { t: 78, msg: "Temperature spike — 23°C → 38°C — Exothermic reaction risk", level: "ALERT" },
  { t: 80, msg: "Emergency: Auto-shutoff valve C-23 triggered", level: "CRITICAL" },
  { t: 82, msg: "Dispatch: Response team notified — ETA 4 min", level: "CRITICAL" },
];

function Glass({ children, style }) {
  return (
    <div style={{
      background: "rgba(8,14,22,0.9)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(80,200,170,0.12)", borderRadius: 8,
      boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.02)",
      ...style,
    }}>{children}</div>
  );
}

// SVG sparkline with glow
function SignalCurve({ data, visibleEnd, color, warnHigh, warnLow, height, width }) {
  const visibleStart = Math.max(0, visibleEnd - 60);
  const visible = data.slice(visibleStart, visibleEnd);
  if (visible.length < 2) return null;

  const allVals = data;
  const minV = Math.min(...allVals) - (Math.max(...allVals) - Math.min(...allVals)) * 0.15;
  const maxV = Math.max(...allVals) + (Math.max(...allVals) - Math.min(...allVals)) * 0.15;
  const range = maxV - minV || 1;

  const points = visible.map((v, i) => {
    const x = (i / (visible.length - 1)) * width;
    const y = height - ((v - minV) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const gradId = `g-${color.replace("#", "")}`;
  const fillPoints = `0,${height} ${points} ${width},${height}`;

  // Check for anomaly in visible range
  const hasAnomaly = visible.some(v => (warnHigh && v > warnHigh) || (warnLow && v < warnLow));
  const lineColor = hasAnomaly ? "#ff3c3c" : color;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${gradId}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line key={i} x1="0" y1={height * p} x2={width} y2={height * p} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      ))}
      {/* Threshold lines */}
      {warnHigh && (
        <line x1="0" y1={height - ((warnHigh - minV) / range) * height} x2={width} y2={height - ((warnHigh - minV) / range) * height}
          stroke="#ff3c3c" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.4" />
      )}
      {warnLow && (
        <line x1="0" y1={height - ((warnLow - minV) / range) * height} x2={width} y2={height - ((warnLow - minV) / range) * height}
          stroke="#ff3c3c" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.4" />
      )}
      {/* Fill */}
      <polygon points={fillPoints} fill={`url(#${gradId})`} />
      {/* Line */}
      <polyline points={points} fill="none" stroke={lineColor} strokeWidth="1.8" strokeLinejoin="round" filter={`url(#glow-${gradId})`} />
      {/* Current value dot */}
      {visible.length > 0 && (
        <>
          <circle cx={width} cy={height - ((visible[visible.length - 1] - minV) / range) * height} r="3.5" fill={lineColor} opacity="0.9">
            <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={width} cy={height - ((visible[visible.length - 1] - minV) / range) * height} r="8" fill="none" stroke={lineColor} opacity="0.2">
            <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}

function LogEntry({ log, time }) {
  const colors = { WARN: "#ffaa00", ALERT: "#ff3c3c", CRITICAL: "#ff3c3c" };
  const c = colors[log.level] || "#00e6a0";
  return (
    <div style={{
      display: "flex", gap: 10, padding: "4px 0",
      animation: "logSlide 0.4s ease",
      borderBottom: "1px solid rgba(255,255,255,0.03)",
    }}>
      <span style={{ fontSize: 8, color: "rgba(255,255,255,.25)", flexShrink: 0, width: 52 }}>[{time}]</span>
      <span style={{ fontSize: 7, fontWeight: 700, color: c, flexShrink: 0, width: 52, letterSpacing: 1 }}>{log.level}</span>
      <span style={{ fontSize: 8.5, color: "rgba(255,255,255,.6)" }}>{log.msg}</span>
    </div>
  );
}

export default function AnomalyDashboard() {
  const [mode, setMode] = useState("normal"); // normal | anomaly
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState([]);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState("12:00:00");
  const tickRef = useRef(0);
  const startRef = useRef(Date.now());

  const data = mode === "anomaly" ? ANOMALY : NORMAL;
  const visibleEnd = Math.min(tick, TOTAL_PTS);

  // Timer
  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);

      // Simulated clock
      const baseH = 12, baseM = 0, baseS = 0;
      const totalSec = baseH * 3600 + baseM * 60 + baseS + tickRef.current;
      const h = String(Math.floor(totalSec / 3600) % 24).padStart(2, "0");
      const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
      const s = String(totalSec % 60).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);

      // Add logs in anomaly mode
      if (mode === "anomaly") {
        ANOMALY_LOGS.forEach(log => {
          if (tickRef.current === log.t) {
            setLogs(prev => [{ ...log, time: `${h}:${m}:${s}` }, ...prev].slice(0, 12));
          }
        });
      }
    }, 500);
    return () => clearInterval(iv);
  }, [paused, mode]);

  const reset = useCallback((newMode) => {
    tickRef.current = 0;
    setTick(0);
    setLogs([]);
    setMode(newMode);
    startRef.current = Date.now();
  }, []);

  // Current values
  const getVal = (key) => {
    const d = data[key];
    const idx = Math.min(visibleEnd, d.length - 1);
    return d[Math.max(0, idx)];
  };

  // Status assessment
  const getStatus = (sig) => {
    const v = getVal(sig.key);
    if (sig.warnHigh && v > sig.warnHigh) return { label: "CRITICAL", color: "#ff3c3c" };
    if (sig.warnLow && v < sig.warnLow) return { label: "CRITICAL", color: "#ff3c3c" };
    if (sig.warnHigh && v > sig.warnHigh * 0.85) return { label: "ELEVATED", color: "#ffaa00" };
    if (sig.warnLow && v < sig.warnLow * 1.3) return { label: "LOW", color: "#ffaa00" };
    return { label: "NORMAL", color: "#00e6a0" };
  };

  const allStatuses = SIGNALS.map(s => ({ ...s, status: getStatus(s) }));
  const hasAlert = allStatuses.some(s => s.status.color === "#ff3c3c");
  const hasWarn = allStatuses.some(s => s.status.color === "#ffaa00");
  const overallRisk = hasAlert ? "HIGH" : hasWarn ? "MEDIUM" : "LOW";
  const overallColor = hasAlert ? "#ff3c3c" : hasWarn ? "#ffaa00" : "#00e6a0";

  // AI analysis messages
  const getAIAnalysis = () => {
    if (!hasAlert && !hasWarn) return [{ msg: "All signals within normal parameters", c: "#00e6a0" }];
    const msgs = [];
    const ps = getStatus(SIGNALS[0]);
    const fs = getStatus(SIGNALS[2]);
    const gs = getStatus(SIGNALS[3]);
    const ts = getStatus(SIGNALS[1]);
    if (gs.color !== "#00e6a0") msgs.push({ msg: "Gas concentration anomaly — Possible leak source", c: gs.color });
    if (fs.color !== "#00e6a0") msgs.push({ msg: "Flow rate deviation — Transfer line integrity check needed", c: fs.color });
    if (ps.color !== "#00e6a0") msgs.push({ msg: "Pressure instability — Correlates with flow anomaly", c: ps.color });
    if (ps.color === "#ff3c3c" && fs.color === "#ff3c3c") msgs.push({ msg: "⚠ Pressure-Flow mismatch → LEAK PROBABLE at Node A3", c: "#ff3c3c" });
    if (ts.color !== "#00e6a0") msgs.push({ msg: "Temperature spike — Potential exothermic reaction", c: ts.color });
    if (msgs.length === 0) msgs.push({ msg: "Minor deviations detected — Monitoring closely", c: "#ffaa00" });
    return msgs;
  };

  return (
    <div style={{
      width: "100%", height: "100vh", position: "relative", overflow: "hidden",
      fontFamily: "'PingFang SC','Helvetica Neue',Arial,sans-serif",
      userSelect: "none",
      background: "linear-gradient(135deg, #060a14 0%, #0a1020 50%, #080e1a 100%)",
    }}>
      <style>{`
        @keyframes fI{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes logSlide{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes riskPulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes aF{0%,100%{border-color:rgba(255,60,60,0.4)}50%{border-color:rgba(255,60,60,0.08)}}
        @keyframes dotPulse{0%,100%{box-shadow:0 0 6px currentColor}50%{box-shadow:0 0 16px currentColor}}
      `}</style>

      {/* Grid background */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(0,230,160,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,160,0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* === TOP BAR === */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 48,
        background: "rgba(0,0,0,0.4)",
        borderBottom: `1px solid ${overallColor}15`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", zIndex: 30,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: overallColor, boxShadow: `0 0 10px ${overallColor}`, animation: hasAlert ? "riskPulse 1s ease-in-out infinite" : "none" }} />
          <span style={{ fontSize: 11, letterSpacing: 3, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>MULTI-SIGNAL ANOMALY MONITORING</span>
        </div>
        <div style={{ fontSize: 15, color: `${overallColor}88`, letterSpacing: 3 }}>{time}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => reset("normal")} style={{
            padding: "5px 14px", borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, cursor: "pointer",
            background: mode === "normal" ? "rgba(0,230,160,.15)" : "rgba(255,255,255,.06)",
            border: `1px solid ${mode === "normal" ? "rgba(0,230,160,.3)" : "rgba(255,255,255,.1)"}`,
            color: mode === "normal" ? "#00e6a0" : "rgba(255,255,255,.4)",
            fontFamily: "'PingFang SC',sans-serif",
          }}>✓ NORMAL</button>
          <button onClick={() => reset("anomaly")} style={{
            padding: "5px 14px", borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, cursor: "pointer",
            background: mode === "anomaly" ? "rgba(255,60,60,.15)" : "rgba(255,255,255,.06)",
            border: `1px solid ${mode === "anomaly" ? "rgba(255,60,60,.3)" : "rgba(255,255,255,.1)"}`,
            color: mode === "anomaly" ? "#ff3c3c" : "rgba(255,255,255,.4)",
            fontFamily: "'PingFang SC',sans-serif",
          }}>⚠ ANOMALY</button>
          <button onClick={() => setPaused(!paused)} style={{
            padding: "5px 14px", borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, cursor: "pointer",
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
            color: "rgba(255,255,255,.4)", fontFamily: "'PingFang SC',sans-serif",
          }}>{paused ? "▶" : "⏸"}</button>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div style={{ position: "absolute", top: 56, left: 18, right: 18, bottom: 130, zIndex: 10, display: "flex", gap: 14 }}>

        {/* LEFT: Signal curves */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 10 }}>
          {SIGNALS.map((sig) => {
            const val = getVal(sig.key);
            const st = getStatus(sig);
            const isAlert = st.color === "#ff3c3c";
            return (
              <Glass key={sig.key} style={{
                padding: "14px 16px", display: "flex", flexDirection: "column",
                borderColor: isAlert ? "rgba(255,60,60,.2)" : "rgba(80,200,170,0.1)",
                transition: "border-color .5s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexShrink: 0 }}>
                  <div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,.35)", letterSpacing: 2, fontWeight: 600, marginBottom: 4 }}>{sig.label}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: st.color, letterSpacing: 1, transition: "color .3s" }}>{val.toFixed(sig.decimals)}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{sig.unit}</span>
                    </div>
                  </div>
                  <div style={{
                    padding: "3px 10px", borderRadius: 3,
                    background: `${st.color}15`, border: `1px solid ${st.color}30`,
                    fontSize: 8, fontWeight: 700, color: st.color, letterSpacing: 1.5,
                    animation: isAlert ? "riskPulse 1s ease-in-out infinite" : "none",
                  }}>{st.label}</div>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <SignalCurve
                    data={data[sig.key]}
                    visibleEnd={visibleEnd}
                    color={sig.color}
                    warnHigh={sig.warnHigh}
                    warnLow={sig.warnLow}
                    height={100}
                    width={320}
                  />
                </div>
              </Glass>
            );
          })}
        </div>

        {/* RIGHT: Status & AI Analysis */}
        <div style={{ width: 260, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* System Status */}
          <Glass style={{ padding: "16px", flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.45)", letterSpacing: 2.5, marginBottom: 12 }}>SYSTEM STATUS</div>
            {allStatuses.map((s) => (
              <div key={s.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", background: s.status.color,
                    boxShadow: `0 0 6px ${s.status.color}`,
                    animation: s.status.color === "#ff3c3c" ? "dotPulse 1s ease-in-out infinite" : "none",
                    color: s.status.color,
                  }} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,.55)" }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.status.color, letterSpacing: 1 }}>{s.status.label}</span>
              </div>
            ))}
          </Glass>

          {/* AI Analysis */}
          <Glass style={{ padding: "16px", flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.45)", letterSpacing: 2.5, marginBottom: 12 }}>AI ANALYSIS</div>
            {getAIAnalysis().map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ color: a.c, fontSize: 10, flexShrink: 0, marginTop: 1 }}>→</span>
                <span style={{ fontSize: 10, color: a.c, lineHeight: 1.5, fontWeight: a.c === "#ff3c3c" ? 700 : 500 }}>{a.msg}</span>
              </div>
            ))}

            {/* Overall Risk */}
            <div style={{
              marginTop: 12, padding: "12px", borderRadius: 6, textAlign: "center",
              background: `${overallColor}10`, border: `1px solid ${overallColor}25`,
              transition: "all .5s",
            }}>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,.3)", letterSpacing: 2, marginBottom: 4 }}>RISK LEVEL</div>
              <div style={{
                fontSize: 24, fontWeight: 900, color: overallColor, letterSpacing: 3,
                textShadow: `0 0 20px ${overallColor}40`,
                animation: hasAlert ? "riskPulse 1s ease-in-out infinite" : "none",
                transition: "color .5s",
              }}>{overallRisk}</div>
            </div>

            {/* Recommendation */}
            {(hasAlert || hasWarn) && (
              <div style={{
                marginTop: 10, padding: "10px 12px", borderRadius: 5,
                background: `${overallColor}08`, border: `1px solid ${overallColor}18`,
              }}>
                <div style={{ fontSize: 8, color: overallColor, letterSpacing: 1.5, fontWeight: 700, marginBottom: 4 }}>RECOMMENDED ACTION</div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>
                  {hasAlert
                    ? "⛔ HALT TRANSFER. Close Valve C-23. Evacuate personnel. Dispatch response team."
                    : "⚡ Increase monitoring frequency. Prepare contingency measures. Notify supervisor."}
                </div>
              </div>
            )}
          </Glass>
        </div>
      </div>

      {/* === BOTTOM: Event Log === */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 122, zIndex: 20 }}>
        <Glass style={{ position: "absolute", inset: 0, margin: "0 18px 12px", padding: "10px 16px", borderRadius: 8, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.45)", letterSpacing: 2.5 }}>SYSTEM LOG</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,.2)" }}>{logs.length} entries</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {logs.length === 0 ? (
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.15)", padding: "8px 0" }}>
                {mode === "normal" ? "System nominal — No anomalies detected" : "Monitoring... Events will appear here"}
              </div>
            ) : (
              logs.map((log, i) => <LogEntry key={`${log.t}-${i}`} log={log} time={log.time} />)
            )}
          </div>
        </Glass>
      </div>

      {/* Alert border */}
      {hasAlert && <div style={{ position: "absolute", inset: 4, zIndex: 50, pointerEvents: "none", border: "2px solid #ff3c3c", borderRadius: 10, animation: "aF .8s ease-in-out infinite" }} />}
    </div>
  );
}
