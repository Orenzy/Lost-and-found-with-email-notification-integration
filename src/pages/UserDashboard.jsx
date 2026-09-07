import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxOpen, FaClipboardList, FaFileAlt, FaProjectDiagram, FaRobot,
  FaSearch, FaShieldAlt, FaSignOutAlt, FaMagic
} from "react-icons/fa";
import { readList } from "../services/store";
import "./UserDashboard.css";

function UserDashboard() {
  const navigate = useNavigate();
  const stats = useMemo(() => ({
    lost: readList("lostItems").filter((x) => x.status !== "Resolved").length,
    found: readList("foundItems").filter((x) => x.status !== "Collected").length,
    claims: readList("claims").filter((x) => x.status !== "Collected" && x.status !== "Rejected").length,
  }), []);

  const cards = [
    [FaClipboardList, "🔴 Report Lost Item", "Upload a photo and let AI identify useful item details.", "/report-lost-item", "AI analysis"],
    [FaBoxOpen, "🟢 Report Found Item", "Report it, then hand the physical item to the Lost & Found Office.", "/report-found-item", "AI + drop-off"],
    [FaProjectDiagram, "🤖 AI Item Matching", "Compare your active lost reports with available found items.", "/ai-matches", "Smart match"],
    [FaShieldAlt, "🛡️ My Claims", "Track verification, admin review, collection code and handover.", "/my-claims", "Claim centre"],
    [FaSearch, "🔎 Lost Reports", "View and manage lost item reports currently in the system.", "/view-lost-items", "Reports"],
    [FaFileAlt, "📦 Found Reports", "View found item reports and their current status.", "/view-found-items", "Reports"],
    [FaRobot, "💬 AI Assistant", "Ask for help with reporting, matching, verification and claims.", "/ai-chatbot", "AI support"],
  ];

  return (
    <main className="dashboard-container">
        <section className="dashboard-hero">
          <div>
            <p className="dashboard-eyebrow"><FaMagic /> SMART LOST & FOUND</p>
            <h1>👋 Welcome to Smart Lost & Found</h1>
            <p>Report items, use AI matching, verify ownership securely and collect approved items with a unique code.</p>
          </div>
          <div className="dashboard-stats">
            <div><strong>{stats.lost}</strong><span>Active lost</span></div>
            <div><strong>{stats.found}</strong><span>Found items</span></div>
            <div><strong>{stats.claims}</strong><span>Open claims</span></div>
          </div>
        </section>

        <section className="workflow-strip">
          {["Report", "Drop-off", "AI match", "Verify", "Admin review", "Collect"].map((step, i) => <div key={step}><span>{i + 1}</span><strong>{step}</strong></div>)}
        </section>

        <div className="dashboard-grid">
          {cards.map(([Icon, title, text, path, badge]) => (
            <button className="dashboard-card" onClick={() => navigate(path)} key={title}>
              <div className="dashboard-card-top"><Icon /><span>{badge}</span></div>
              <h3>{title}</h3><p>{text}</p><small>Open feature →</small>
            </button>
          ))}
        </div>

        <button className="logout-btn" onClick={() => navigate("/login")}><FaSignOutAlt /> Logout</button>
      </main>
  );
}
export default UserDashboard;
