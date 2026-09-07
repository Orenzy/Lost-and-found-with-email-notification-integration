import { Link } from "react-router-dom";
import "./LandingPage.css";

function Home() {
  return (
    <div className="public-landing">
      <header className="public-header">
        <Link to="/" className="public-logo" aria-label="Lost and Found home">
          <span className="public-logo-icon">🔎</span>
          <span>Lost & <strong>Found</strong></span>
        </Link>

        <nav className="public-nav-links" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="public-nav-actions">
          <Link to="/login" className="public-btn public-btn-outline">User Login</Link>
          <Link to="/admin-login" className="public-btn public-btn-admin">Admin Login</Link>
          <Link to="/register" className="public-btn public-btn-primary">Register</Link>
        </div>
      </header>

      <main>
        <section className="public-hero" id="home">
          <div className="public-hero-content">
            <div className="public-badge">✦ Smart • Secure • Reliable</div>
            <h1>Lost & Found<br />Management <span>System</span></h1>
            <p>
              Report lost items, hand in found belongings, find intelligent matches,
              verify ownership and complete safe collection through one secure platform.
            </p>

            <div className="public-hero-actions">
              <Link to="/login" className="public-btn public-btn-primary public-btn-large">👤 Login as User</Link>
              <Link to="/admin-login" className="public-btn public-btn-admin public-btn-large">🛡️ Login as Admin</Link>
              <Link to="/register" className="public-btn public-btn-light public-btn-large">✨ Create Account</Link>
            </div>

            <div className="public-security-note"><span>✓</span> Secure reporting, verification and collection workflow.</div>
          </div>

          <div className="public-hero-visual">
            <div className="public-visual-circle" />
            <div className="public-item-card">
              <div className="public-bag-icon">🎒</div>
              <h3>Lost your item?</h3>
              <p>Report it in just a few simple steps.</p>
            </div>
            <div className="public-floating-card public-search-card">🔍</div>
            <div className="public-floating-card public-shield-card">🛡️</div>
            <div className="public-floating-card public-document-card">📋</div>
          </div>
        </section>

        <section className="public-features" id="features">
          <div className="public-section-heading">
            <span>KEY FEATURES</span>
            <h2>Everything you need in one place</h2>
            <p>A complete lost-and-found workflow for users, finders and administrators.</p>
          </div>

          <div className="public-feature-grid">
            <article className="public-feature-card"><div className="public-feature-icon">📝</div><h3>Report Lost Items</h3><p>Upload a photo and details while AI helps identify useful item information.</p></article>
            <article className="public-feature-card"><div className="public-feature-icon">📦</div><h3>Report & Drop Off Found Items</h3><p>Report a found item, receive a drop-off reference and hand it to the Lost & Found Office.</p></article>
            <article className="public-feature-card"><div className="public-feature-icon">🤖</div><h3>AI Matching</h3><p>Compare active lost reports with found items that have been physically received by staff.</p></article>
            <article className="public-feature-card"><div className="public-feature-icon">🔐</div><h3>Ownership Verification</h3><p>Answer private item questions before a claim can be submitted for review.</p></article>
            <article className="public-feature-card"><div className="public-feature-icon">👨‍💼</div><h3>Admin Review</h3><p>Administrators review verified claims before approving or rejecting them.</p></article>
            <article className="public-feature-card"><div className="public-feature-icon">🔑</div><h3>Safe Collection</h3><p>Approved users receive a collection code that staff verify before the item is released.</p></article>
          </div>
        </section>

        <section className="public-how" id="how-it-works">
          <div className="public-section-heading">
            <span>HOW IT WORKS</span>
            <h2>From report to safe return</h2>
          </div>
          <div className="public-steps">
            <div className="public-step"><div className="public-step-number">1</div><h3>Report</h3><p>Create a lost or found item report with details and a photo.</p></div>
            <div className="public-step"><div className="public-step-number">2</div><h3>Drop-off</h3><p>Found items are handed to the office and marked received by staff.</p></div>
            <div className="public-step"><div className="public-step-number">3</div><h3>Match</h3><p>AI compares eligible lost and found reports and ranks possible matches.</p></div>
            <div className="public-step"><div className="public-step-number">4</div><h3>Verify</h3><p>The claimant answers three private ownership questions correctly.</p></div>
            <div className="public-step"><div className="public-step-number">5</div><h3>Approve</h3><p>An administrator reviews the claim and approves the successful owner.</p></div>
            <div className="public-step"><div className="public-step-number">6</div><h3>Collect</h3><p>The user receives a collection code and staff confirm it during handover.</p></div>
          </div>
        </section>

        <section className="public-portals">
          <div className="public-portal-card public-user-portal">
            <div className="public-portal-icon">👤</div>
            <div><small>USER PORTAL</small><h2>Report, match and track your claim</h2><p>Access lost and found reports, AI matching, ownership verification and collection details.</p></div>
            <Link to="/login" className="public-btn public-btn-primary">User Login →</Link>
          </div>
          <div className="public-portal-card public-admin-portal">
            <div className="public-portal-icon">🛡️</div>
            <div><small>ADMIN PORTAL</small><h2>Manage intake, claims and handovers</h2><p>Receive found items, review claims, approve ownership and confirm final collection.</p></div>
            <Link to="/admin-login" className="public-btn public-btn-admin">Admin Login →</Link>
          </div>
        </section>
      </main>

      <footer className="public-footer" id="contact">
        <div><strong>🔎 Lost & Found Management System</strong><span>Smart • Secure • Reliable</span></div>
        <p>© 2026 Lost & Found Management System</p>
      </footer>
    </div>
  );
}

export default Home;
