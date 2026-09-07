import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUserShield } from "react-icons/fa";
import "./Login.css";

function AdminLogin() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState({ email: "", password: "" });
  const handleChange = (e) => setAdmin({ ...admin, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!admin.email || !admin.password) return alert("Please enter the admin email and password.");
    localStorage.setItem("currentUser", JSON.stringify({ email: admin.email.trim(), role: "admin", loggedInAt: new Date().toISOString() }));
    navigate("/admin-dashboard");
  };
  return <div className="login-container auth-shell admin-auth-shell"><div className="login-card auth-card admin-auth-card">
    <button className="auth-back" onClick={() => navigate("/")}>← Back to home</button>
    <div className="auth-role-icon admin-icon"><FaUserShield/></div><h1>Admin Login</h1><p>Access item intake, claim reviews and collection handovers.</p>
    <form onSubmit={handleSubmit}>
      <label className="auth-label">Admin email</label><div className="input-group"><FaEnvelope className="icon"/><input type="email" name="email" placeholder="admin@example.com" value={admin.email} onChange={handleChange}/></div>
      <label className="auth-label">Password</label><div className="input-group"><FaLock className="icon"/><input type="password" name="password" placeholder="Enter admin password" value={admin.password} onChange={handleChange}/></div>
      <button type="submit" className="auth-login-btn admin-login-btn"><FaUserShield/> Login as Admin</button>
    </form>
    
    <button className="switch-auth" onClick={() => navigate("/login")}>👤 Return to User Login</button>
  </div></div>;
}
export default AdminLogin;
