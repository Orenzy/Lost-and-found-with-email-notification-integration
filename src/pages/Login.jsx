import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ email: "", password: "" });
  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user.email || !user.password) return alert("Please enter your email and password.");
    localStorage.setItem("currentUser", JSON.stringify({ email: user.email.trim(), role: "user", loggedInAt: new Date().toISOString() }));
    navigate("/dashboard");
  };
  return <div className="login-container auth-shell"><div className="login-card auth-card">
    <button className="auth-back" onClick={() => navigate("/")}>← Back to home</button>
    <div className="auth-role-icon">👤</div><h1>User Login</h1><p>Access your reports, AI matches and claims.</p>
    <form onSubmit={handleSubmit}>
      <label className="auth-label">Email address</label><div className="input-group"><FaEnvelope className="icon"/><input type="email" name="email" placeholder="you@example.com" value={user.email} onChange={handleChange}/></div>
      <label className="auth-label">Password</label><div className="input-group"><FaLock className="icon"/><input type="password" name="password" placeholder="Enter password" value={user.password} onChange={handleChange}/></div>
      <button type="submit" className="auth-login-btn"><FaSignInAlt/> Login as User</button>
    </form>
    <div className="register-link"><p>Don't have an account?</p><button className="register-btn" onClick={() => navigate("/register")}>✨ Create Account</button></div>
    <button className="switch-auth" onClick={() => navigate("/admin-login")}>🛡️ Administrator? Use Admin Login</button>
  </div></div>;
}
export default Login;
