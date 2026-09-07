import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaShieldAlt } from "react-icons/fa";
import { readList, readValue, writeList, writeValue } from "../services/store";
import { getCurrentUserEmail, sendClaimSubmittedEmail } from "../services/notify";
import "./VerifyClaim.css";

function normalise(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function VerifyClaim() {
  const navigate = useNavigate();
  const claim = useMemo(() => readValue("activeClaim", null), []);
  const lostItems = useMemo(() => readList("lostItems"), []);
  const foundItems = useMemo(() => readList("foundItems"), []);
  const lostItem = lostItems.find((item) => claim && String(item.id) === String(claim.lostItemId));
  const foundItem = foundItems.find((item) => claim && String(item.id) === String(claim.foundItemId));
  const verification = lostItem?.privateVerification || [];
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  function verifyOwnership(event) {
    event.preventDefault();
    if (!verification.length) {
      setResult({ passed: false, message: "No private verification questions are stored for this lost report." });
      return;
    }
    if (verification.some(({ question }) => !answers[question]?.trim())) {
      setResult({ passed: false, message: "Please answer every ownership verification question." });
      return;
    }

    const correct = verification.filter(({ question, answer }) => normalise(answers[question]) === normalise(answer)).length;
    // Require at least 2 of 3 correct answers for a practical classroom demo.
    const requiredCorrect = verification.length >= 3 ? 2 : verification.length;
    const passed = correct >= requiredCorrect;
    const nextVerification = {
      ...claim,
      verifiedAt: new Date().toISOString(),
      passed,
      correctAnswers: correct,
      totalQuestions: verification.length,
      requiredCorrect,
    };
    writeValue("latestClaimVerification", nextVerification);
    setVerificationResult(nextVerification);
    setResult({
      passed,
      message: passed
        ? "Ownership verification passed. You can now submit this verified claim for administrator review."
        : `Ownership verification did not pass. ${correct} of ${verification.length} answers matched. You need ${requiredCorrect} correct.`,
    });
  }

  async function submitVerifiedClaim() {
    if (!verificationResult?.passed) return;
    const claims = readList("claims");
    const existing = claims.find((entry) =>
      String(entry.lostItemId) === String(claim.lostItemId) &&
      String(entry.foundItemId) === String(claim.foundItemId) &&
      entry.status !== "Rejected"
    );
    const createdClaim = existing || {
      id: `CLM-${Date.now()}`,
      ...claim,
      claimantEmail: getCurrentUserEmail() || lostItem?.reporterEmail || "",
      verificationPassed: true,
      correctAnswers: verificationResult.correctAnswers,
      totalQuestions: verificationResult.totalQuestions,
      requiredCorrect: verificationResult.requiredCorrect,
      verifiedAt: verificationResult.verifiedAt,
      submittedAt: new Date().toISOString(),
      status: "Pending Admin Review",
      adminNote: "",
    };
    if (!existing) writeList("claims", [...claims, createdClaim]);
    writeValue("latestSubmittedClaim", createdClaim);
    if (!existing) {
      await sendClaimSubmittedEmail({ claim: createdClaim, lostItem, foundItem });
    }
    navigate("/claim-submitted");
  }

  if (!claim || !lostItem || !foundItem) {
    return <main className="verify-page"><div className="verify-shell"><section className="verify-card empty-claim-card"><FaExclamationTriangle className="empty-claim-icon"/><h1>No active claim found</h1><p>Start ownership verification from an AI match result first.</p><button onClick={() => navigate("/ai-matches")}>Back to AI Matches</button></section></div></main>;
  }

  return (
    <main className="verify-page"><div className="verify-shell">
      <header className="verify-header">
        <div className="verify-title-wrap"><div className="verify-icon"><FaShieldAlt/></div><div><p className="verify-eyebrow">OWNERSHIP VERIFICATION</p><h1>Verify Claim</h1><p className="verify-subtitle">Answer the same 3 ownership questions saved with the lost report. They ask for slightly more specific item details, and at least 2 of the 3 answers must be correct.</p></div></div>
        <button className="verify-back" onClick={() => navigate("/ai-matches")}><FaArrowLeft/> AI Matches</button>
      </header>
      <section className="claim-summary-card"><div><span>Lost item</span><strong>{lostItem.title || "Lost item"}</strong></div><div><span>Potential found match</span><strong>{foundItem.title || "Found item"}</strong></div><div><span>AI match score</span><strong>{claim.score ?? "—"}%</strong></div></section>
      <section className="verify-card">
        <div className="verify-card-heading"><FaShieldAlt/><div><h2>Ownership detail questions</h2><p>Three moderately specific questions. At least 2 of the 3 must be correct to continue to admin review.</p></div></div>
        {verification.length ? <form onSubmit={verifyOwnership} className="verification-form">
          {verification.map(({ question }, index) => <label className="verification-question" key={question}><span>{index + 1}. {question}</span><input type="text" value={answers[question] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question]: event.target.value }))} placeholder="Enter your answer" autoComplete="off" disabled={Boolean(result?.passed)}/></label>)}
          {!result?.passed && <button className="verify-submit" type="submit"><FaShieldAlt/> Verify Ownership</button>}
        </form> : <div className="verify-warning"><FaExclamationTriangle/><div><strong>No verification questions found</strong><p>Re-report the lost item with AI image analysis so private ownership questions are stored.</p></div></div>}
        {result && <><div className={`verification-result ${result.passed ? "success" : "failed"}`}>{result.passed ? <FaCheckCircle/> : <FaExclamationTriangle/>}<div><strong>{result.passed ? "Verification passed" : "Verification not passed"}</strong><p>{result.message}</p></div></div>{result.passed && <button className="verify-submit" type="button" style={{marginTop:16}} onClick={submitVerifiedClaim}><FaCheckCircle/> Submit Claim for Admin Review</button>}</>}
      </section>
    </div></main>
  );
}
export default VerifyClaim;
