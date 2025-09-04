import React from 'react';

function LandingPage({ onGetStarted }) {
  const features = [
    {
      icon: '🔒',
      title: 'Secure Authentication',
      description: 'Face-verified login ensures only authorized users can participate in the voting process.'
    },
    {
      icon: '⚡',
      title: 'Seamless Experience',
      description: 'Intuitive interface designed for accessibility and ease of use across all devices.'
    },
    {
      icon: '📊',
      title: 'Real-time Results',
      description: 'Track voting progress and results in real-time with comprehensive analytics.'
    },
    {
      icon: '🛡️',
      title: 'Blockchain Security',
      description: 'Advanced security measures protect the integrity of every vote cast.'
    },
    {
      icon: '📱',
      title: 'Mobile Optimized',
      description: 'Vote from anywhere using your smartphone or computer with full mobile support.'
    },
    {
      icon: '🎯',
      title: 'Admin Dashboard',
      description: 'Comprehensive management tools for election administrators and organizers.'
    }
  ];

  const stats = [
    { number: '100%', label: 'Secure' },
    { number: '24/7', label: 'Available' },
    { number: '∞', label: 'Scalable' },
    { number: '0', label: 'Fraud Cases' }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Revolutionizing Democracy with
            <span className="hero-highlight"> Face-Verified Voting</span>
          </h1>
          <p className="hero-subtitle">
            VoteNova brings secure, seamless, and transparent elections to the digital age.
            Experience the future of democratic participation with cutting-edge facial recognition technology.
          </p>
          <div className="hero-actions">
            <button className="vn-btn hero-cta" onClick={onGetStarted}>
              Get Started
            </button>
            <button className="vn-btn secondary hero-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-card-icon">🗳️</div>
            <h3>Cast Your Vote</h3>
            <p>Secure and anonymous voting process</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose VoteNova?</h2>
          <p className="section-subtitle">
            Experience the most advanced voting platform with enterprise-grade security and user-friendly design.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Simple, secure, and transparent voting in just three easy steps.
          </p>
        </div>
        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-icon">📸</div>
            <h3>Register with Face ID</h3>
            <p>Create your secure account using facial recognition technology</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-icon">🔐</div>
            <h3>Verify Identity</h3>
            <p>Authenticate securely before casting your vote</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-icon">✅</div>
            <h3>Cast Your Vote</h3>
            <p>Vote securely and anonymously with complete privacy</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Make Your Voice Heard?</h2>
          <p>Join thousands of voters who trust VoteNova for secure and transparent elections.</p>
          <button className="vn-btn hero-cta" onClick={onGetStarted}>
            Start Voting Now
          </button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;