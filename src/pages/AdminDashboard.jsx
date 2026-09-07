import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaBoxOpen, FaClipboardList, FaInbox, FaRobot, FaShieldAlt, FaUsers } from "react-icons/fa";
import { readList } from "../services/store";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const stats = useMemo(() => ({
    waitingDropoff: readList("foundItems").filter((x) => ["Awaiting Drop-off", "Found"].includes(x.status)).length,
    users: readList("users").length,
    review: readList("claims").filter((x) => x.status === "Pending Admin Review").length,
    collection: readList("claims").filter((x) => x.status === "Ready for Collection").length,
  }), []);
  const cards = [
    [FaInbox, "Found Item Intake", "Receive physical drop-offs and release them for AI matching.", "/admin-found-intake"],
    [FaShieldAlt, "Claim & Collection Desk", "Review verified claims, issue collection codes and confirm handover.", "/admin-claims"],
    [FaClipboardList, "Lost Reports", "Review active and resolved lost item reports.", "/view-lost-items"],
    [FaBoxOpen, "Found Reports", "Review found, reserved and collected item reports.", "/view-found-items"],
    [FaRobot, "AI Matching", "Review the AI matching experience used by claimants.", "/ai-matches"],
    [FaUsers, "Manage Users", "View registered users and manage account records.", "/admin-users"],
  ];
  return <><Navbar admin /><main className="admin-container">
    <section className="admin-hero"><div><p className="admin-eyebrow">ADMIN OPERATIONS</p><h1>Lost & Found Control Centre</h1><p>Manage reports, ownership claims and safe item handovers from one place.</p></div><div className="admin-stats"><div><strong>{stats.waitingDropoff}</strong><span>Awaiting drop-off</span></div><div><strong>{stats.review}</strong><span>Need review</span></div><div><strong>{stats.collection}</strong><span>Ready to collect</span></div><div><strong>{stats.users}</strong><span>Registered users</span></div></div></section>
    <div className="admin-grid">{cards.map(([Icon,title,text,path])=><button className="admin-card" onClick={()=>navigate(path)} key={title}><Icon/><h3>{title}</h3><p>{text}</p><small>Open →</small></button>)}</div>
  </main></>;
}
export default AdminDashboard;
