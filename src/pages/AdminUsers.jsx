import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaTrash, FaUserShield, FaUsers } from "react-icons/fa";
import "./Claims.css";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem("users") || "[]"));

  function removeUser(id) {
    if (!window.confirm("Remove this user record?")) return;
    const updated = users.filter((user) => user.id !== id);
    setUsers(updated);
    localStorage.setItem("users", JSON.stringify(updated));
  }

  return (
    <>
      <Navbar admin />
      <main className="claims-page claims-with-nav">
        <div className="claims-shell">
          <header className="claims-header">
            <div>
              <p className="claims-eyebrow">ADMIN</p>
              <h1><FaUsers /> Manage Users</h1>
              <p>View and manage registered users.</p>
            </div>
            <button className="secondary-action" onClick={() => navigate("/admin-dashboard")}><FaUserShield /> Admin Dashboard</button>
          </header>

          {!users.length ? (
            <section className="claims-empty"><FaUsers /><h2>No registered users yet</h2><p>New registrations will appear here.</p></section>
          ) : (
            <div className="claims-list">
              {users.map((user) => (
                <article className="claim-card" key={user.id}>
                  <div className="claim-card-top">
                    <div><span className="claim-ref">USER</span><h2>{user.name}</h2><p>{user.email}</p></div>
                    <button className="reject-action" onClick={() => removeUser(user.id)}><FaTrash /> Remove</button>
                  </div>
                  <div className="claim-meta-grid">
                    <div><span>Role</span><strong>User</strong></div>
                    <div><span>Registered</span><strong>{new Date(user.createdAt).toLocaleString()}</strong></div>
                    <div><span>Status</span><strong>Active</strong></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default AdminUsers;
