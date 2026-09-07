import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaClipboardList, FaHome, FaShieldAlt } from "react-icons/fa";
import "./Claims.css";

function ClaimSubmitted() {
  const navigate = useNavigate();
  const claim = useMemo(
    () => JSON.parse(localStorage.getItem("latestSubmittedClaim") || "null"),
    []
  );

  return (
    <main className="claims-page">
      <section className="claims-shell claim-success-card">
        <FaCheckCircle className="claim-success-icon" />
        <p className="claims-eyebrow">CLAIM SUBMITTED</p>
        <h1>Ownership verified successfully</h1>
        <p className="claims-lead">
          Your claim has been sent for admin review. The item is not released until an administrator approves the claim.
        </p>

        {claim && (
          <div className="claim-reference">
            <div><span>Claim reference</span><strong>{claim.id}</strong></div>
            <div><span>Status</span><strong>{claim.status}</strong></div>
            <div><span>AI match score</span><strong>{claim.score ?? "—"}%</strong></div>
          </div>
        )}

        <div className="claims-actions centered-actions">
          <button className="primary-action" onClick={() => navigate("/my-claims")}>
            <FaClipboardList /> View My Claims
          </button>
          <button className="secondary-action" onClick={() => navigate("/dashboard")}>
            <FaHome /> Dashboard
          </button>
        </div>

        <div className="claims-note"><FaShieldAlt /> AI matching and simple ownership questions support the process, but final approval remains an admin decision. No collection code is issued until an admin approves the claim.</div>
      </section>
    </main>
  );
}

export default ClaimSubmitted;
