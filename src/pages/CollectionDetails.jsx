import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaCopy,
  FaMapMarkerAlt,
  FaShieldAlt,
} from "react-icons/fa";
import { readList, repairApprovedClaimsMissingCodes } from "../services/store";
import "./Claims.css";

function CollectionDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const claim = useMemo(
    () => repairApprovedClaimsMissingCodes().find((entry) => String(entry.id) === String(id)),
    [id]
  );

  async function copyCode() {
    if (!claim?.collectionCode) return;
    try {
      await navigator.clipboard.writeText(claim.collectionCode);
      alert("Collection code copied.");
    } catch {
      alert(`Collection code: ${claim.collectionCode}`);
    }
  }

  if (!claim) {
    return (
      <main className="claims-page">
        <section className="claims-shell claims-empty">
          <FaBoxOpen />
          <h2>Claim not found</h2>
          <p>Return to My Claims and open a valid claim.</p>
          <button className="primary-action" onClick={() => navigate("/my-claims")}>My Claims</button>
        </section>
      </main>
    );
  }

  const ready = ["Ready for Collection", "Approved", "Collected"].includes(claim.status);

  return (
    <main className="claims-page">
      <div className="claims-shell">
        <header className="claims-header">
          <div>
            <p className="claims-eyebrow">COLLECTION</p>
            <h1><FaBoxOpen /> Collection Details</h1>
            <p>Collection details and the collection code are created only after the administrator approves your claim.</p>
          </div>
          <button className="secondary-action" onClick={() => navigate("/my-claims")}><FaArrowLeft /> My Claims</button>
        </header>

        {!ready ? (
          <section className="claims-empty">
            <FaClock />
            <h2>Not ready for collection</h2>
            <p>Your claim is currently <strong>{claim.status}</strong>. Collection details appear after admin approval.</p>
          </section>
        ) : (
          <section className="collection-card">
            <div className="collection-success-row">
              <div className="collection-icon"><FaCheckCircle /></div>
              <div>
                <p className="claims-eyebrow">{claim.status === "Collected" ? "HANDOVER COMPLETE" : "APPROVED"}</p>
                <h2>{claim.status === "Collected" ? "Item collected" : "Your item is ready for collection"}</h2>
                <p>{claim.status === "Collected" ? "The administrator recorded the physical handover." : "Take your collection code to the location below. The admin will verify it before releasing the item."}</p>
              </div>
            </div>

            <div className="collection-code-panel">
              <span>Collection code</span>
              <strong>{claim.collectionCode || "Not issued"}</strong>
              {claim.status !== "Collected" && claim.collectionCode && (
                <button onClick={copyCode}><FaCopy /> Copy</button>
              )}
            </div>

            <div className="collection-detail-grid">
              <div><FaMapMarkerAlt /><span>Collection location</span><strong>{claim.collectionLocation || "Lost & Found Office"}</strong></div>
              <div><FaShieldAlt /><span>Claim reference</span><strong>{claim.id}</strong></div>
              <div><FaClock /><span>{claim.status === "Collected" ? "Collected at" : "Approved at"}</span><strong>{new Date(claim.collectedAt || claim.codeIssuedAt || claim.reviewedAt || claim.submittedAt).toLocaleString()}</strong></div>
            </div>

            <div className="collection-instructions">
              <strong>Collection instructions</strong>
              <p>{claim.collectionInstructions || "Show your claim reference and collection code to the lost & found administrator. The item is released only after the code is confirmed."}</p>
            </div>

            {claim.status !== "Collected" && (
              <div className="claims-note"><FaShieldAlt /> Do not post or share your collection code publicly. It is used by the administrator to confirm the handover.</div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default CollectionDetails;
