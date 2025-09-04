import React from 'react';

function ThankYou({ candidate, onBackToHome, onViewResults }) {
  return (
    <div className="thank-you-page">
      <div className="thank-you-container">
        {/* Success Animation */}
        <div className="success-animation">
          <div className="success-circle">
            <div className="checkmark">✓</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="thank-you-content">
          <h1 className="thank-you-title">Thank You for Voting!</h1>
          <p className="thank-you-subtitle">
            Your vote has been successfully recorded and secured.
          </p>

          {candidate && (
            <div className="vote-confirmation">
              <div className="confirmation-card">
                <div className="confirmation-icon">🗳️</div>
                <h3>You voted for</h3>
                <div className="candidate-name">{candidate}</div>
                <div className="confirmation-time">
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <div className="thank-you-message">
            <h3>What happens next?</h3>
            <div className="next-steps">
              <div className="step">
                <div className="step-icon">🔐</div>
                <div className="step-content">
                  <h4>Your vote is secured</h4>
                  <p>Using advanced encryption and blockchain technology</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon">📊</div>
                <div className="step-content">
                  <h4>Results will be available</h4>
                  <p>Once the voting period ends, results will be published</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon">📧</div>
                <div className="step-content">
                  <h4>You'll be notified</h4>
                  <p>Receive updates about election results and outcomes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="thank-you-actions">
            <button className="vn-btn" onClick={onViewResults}>
              View Live Results
            </button>
            <button className="vn-btn secondary" onClick={onBackToHome}>
              Back to Home
            </button>
          </div>

          {/* Additional Info */}
          <div className="thank-you-footer">
            <div className="security-note">
              <div className="security-icon">🛡️</div>
              <p>Your vote is anonymous and cannot be traced back to you.</p>
            </div>
            <div className="help-text">
              <p>Need help? Contact our support team at <a href="mailto:support@votenova.com">support@votenova.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThankYou;