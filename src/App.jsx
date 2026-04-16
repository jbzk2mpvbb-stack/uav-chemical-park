import { useState } from "react";
import AROperationGuide from "./demos/AROperationGuide";
import UAVDetection from "./demos/UAVDetection";
import UAVRealtimeMonitor from "./demos/UAVRealtimeMonitor";
import ControlCenter from "./demos/ControlCenter";

const DEMOS = [
  { id: "control", name: "Control Center", desc: "Park-wide monitoring dashboard with aerial map, multi-zone signals, AI agent", component: ControlCenter },
  { id: "ar", name: "AR Operation Guide", desc: "AR-assisted unloading procedure with step-by-step guidance", component: AROperationGuide },
  { id: "detect", name: "UAV Detection", desc: "Object detection + safety state classification from drone view", component: UAVDetection },
  { id: "realtime", name: "Realtime Monitor", desc: "Simulated UAV monitoring with Sense → Judge → Act event feed", component: UAVRealtimeMonitor },
];

export default function App() {
  const [active, setActive] = useState(null);

  if (active) {
    const demo = DEMOS.find(d => d.id === active);
    const Comp = demo.component;
    return (
      <div style={{ width: "100%", height: "100vh", position: "relative" }}>
        <Comp />
        <button
          onClick={() => setActive(null)}
          style={{
            position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
            zIndex: 9999, padding: "8px 24px", borderRadius: 20,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", fontSize: 11, fontWeight: 600, letterSpacing: 1.5,
            cursor: "pointer", fontFamily: "'PingFang SC','Helvetica Neue',sans-serif",
            transition: "all .3s",
          }}
          onMouseEnter={e => e.target.style.background = "rgba(0,0,0,0.9)"}
          onMouseLeave={e => e.target.style.background = "rgba(0,0,0,0.7)"}
        >
          ← BACK TO MENU
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: "linear-gradient(135deg, #060a14 0%, #0a1020 50%, #080e1a 100%)",
      fontFamily: "'PingFang SC','Helvetica Neue',Arial,sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 20px",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeUp .6s ease" }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "rgba(0,230,160,0.4)", fontWeight: 700, marginBottom: 12 }}>
          UAV SWARM SYSTEM FOR CHEMICAL PARK
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: 2, lineHeight: 1.3 }}>
          Full-Cycle Intelligent Control
        </h1>
        <h2 style={{ fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.4)", margin: "8px 0 0", letterSpacing: 1 }}>
          of Hazardous Material Transport
        </h2>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16, maxWidth: 960, width: "100%",
      }}>
        {DEMOS.map((demo, i) => (
          <div
            key={demo.id}
            onClick={() => setActive(demo.id)}
            style={{
              background: "rgba(8,14,22,0.8)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(80,200,170,0.1)",
              borderRadius: 12, padding: "28px 24px",
              cursor: "pointer", transition: "all .3s ease",
              animation: `fadeUp .5s ease ${i * 0.1}s both`,
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = "1px solid rgba(0,230,160,0.3)";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 36px rgba(0,230,160,0.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = "1px solid rgba(80,200,170,0.1)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)";
            }}
          >
            <div style={{ fontSize: 8, letterSpacing: 3, color: "rgba(0,230,160,0.4)", fontWeight: 700, marginBottom: 10 }}>
              DEMO {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8, letterSpacing: 0.5 }}>
              {demo.name}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              {demo.desc}
            </div>
            <div style={{ marginTop: 16, fontSize: 10, color: "#00e6a0", fontWeight: 600, letterSpacing: 1.5 }}>
              LAUNCH →
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 48, textAlign: "center", animation: "fadeUp .6s ease .5s both" }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: 2 }}>
          PORTFOLIO PROJECT — HCI APPLICATION — 2025
        </div>
      </div>
    </div>
  );
}
