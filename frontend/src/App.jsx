import { useState, useEffect } from 'react';

const initialTrustMetrics = [
  { label: 'Self-consistency', description: 'Consistency across sampled response paths', weight: 25, value: 84 },
  { label: 'Semantic agreement', description: 'Alignment with vector database embeddings', weight: 25, value: 71 },
  { label: 'Source quality', description: 'Fidelity index of retrieved references', weight: 20, value: 65 },
  { label: 'Retrieval completeness', description: 'Context coverage across prompt constraints', weight: 15, value: 88 },
  { label: 'External verification', description: 'Cross-validation against ground truth facts', weight: 10, value: 59 }
];

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [view, setView] = useState('auth');
  const [activeTopic, setActiveTopic] = useState('Trust analysis');
  const [mobileTab, setMobileTab] = useState('chat');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [trustMetrics, setTrustMetrics] = useState(initialTrustMetrics);
  const [showAdv, setShowAdv] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [a11yModes, setA11yModes] = useState({
    dyslexia: false,
    adhd: false,
    highContrast: false,
    largeText: false
  });

  const toggleA11y = (modeKey) => {
    setA11yModes((prev) => ({ ...prev, [modeKey]: !prev[modeKey] }));
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleDeleteMessage = (id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const topics = ['Trust analysis', 'Model summary', 'Explainability', 'Next actions'];

  const reasoningSteps = [
    { step: '1. Intent & Context Parsing', status: 'Complete', confidence: '98%' },
    { step: '2. Vector Knowledge Retrieval', status: 'Complete', confidence: '92%' },
    { step: '3. Multi-Signal Verification', status: 'In Progress', confidence: '86%' },
    { step: '4. Faithfulness & Alignment', status: 'Verified', confidence: '94%' }
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert(`${isLogin ? 'Login' : 'Registration'} submitted for ${formData.email}`);
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;

    const userText = draft.trim();
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, sender: 'user', text: userText },
      { id: prev.length + 2, sender: 'bot', text: `CLARIO-1 suggests a calm, secure next step for: “${userText}”.` }
    ]);
    setTrustMetrics((prev) =>
      prev.map((metric) => ({
        ...metric,
        value: Math.max(50, Math.min(100, metric.value + (Math.random() * 16 - 8)))
      }))
    );
    setDraft('');
  };

  const [reliabilityThreshold, setReliabilityThreshold] = useState(75);
  const [selectedMetricLabels, setSelectedMetricLabels] = useState([
    'Self-consistency',
    'Semantic agreement',
    'Source quality',
    'Retrieval completeness',
    'External verification'
  ]);

  const toggleMetricSelection = (label) => {
    setSelectedMetricLabels((prev) => {
      if (prev.includes(label)) {
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== label);
      }
      return [...prev, label];
    });
  };

  const activeMetrics = trustMetrics.filter((m) => selectedMetricLabels.includes(m.label));
  const activeTotalWeight = activeMetrics.reduce((acc, m) => acc + m.weight, 0);
  const cumulativeTrustScore = activeMetrics.length > 0
    ? Math.round(activeMetrics.reduce((acc, m) => acc + m.value * m.weight, 0) / (activeTotalWeight || 1))
    : 0;

  const crystalState = cumulativeTrustScore >= reliabilityThreshold
    ? 'radiant'
    : cumulativeTrustScore >= Math.max(40, reliabilityThreshold - 15)
    ? 'harmonizing'
    : 'fractured';

  const renderTrustPanel = () => (
    <aside className="trust-panel">
      {/* Upper Division: Fantasy Crystal Visualizer */}
      <div className="trust-upper-division">
        <div className="panel-header-row">
          <div>
            <p className="eyebrow">Reasoning Crystal</p>
            <h4>Visual Intelligence</h4>
          </div>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            <span className="theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="theme-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
        </div>

        <div className={`crystal-container-card ${crystalState}`}>
          <div className="crystal-stage">
            <div className="crystal-aura-ring ring-1" />
            <div className="crystal-aura-ring ring-2" />

            <div className="crystal-gem">
              <div className="facet facet-top-1" />
              <div className="facet facet-top-2" />
              <div className="facet facet-top-3" />
              <div className="facet facet-top-4" />
              <div className="facet facet-bottom-1" />
              <div className="facet facet-bottom-2" />
              <div className="facet facet-bottom-3" />
              <div className="facet facet-bottom-4" />
              
              <div className="crystal-core" />
              
              {crystalState === 'fractured' && (
                <div className="crystal-fracture-overlay">
                  <div className="crack crack-1" />
                  <div className="crack crack-2" />
                  <div className="crack crack-3" />
                </div>
              )}
            </div>

            <div className="shard shard-1" />
            <div className="shard shard-2" />
            <div className="shard shard-3" />
          </div>

          <div className="crystal-meta-row">
            <div className="crystal-status-badge">
              <span className={`status-orb-dot ${crystalState}`} />
              <span className="crystal-status-text">
                {crystalState === 'radiant' && 'Radiant Core'}
                {crystalState === 'harmonizing' && 'Harmonic Core'}
                {crystalState === 'fractured' && 'Fractured Core'}
              </span>
            </div>
            <div className="cumulative-score-display">
              <span className="score-val">{cumulativeTrustScore}%</span>
              <span className="score-lbl">Trust Score</span>
            </div>
          </div>
        </div>
      </div>

      <div className="division-divider" />

      {/* Lower Division: Expandable toggle "ADV" for advanced metrics */}
      <div className="trust-lower-division">
        <button
          type="button"
          className="adv-toggle-btn"
          onClick={() => setShowAdv((prev) => !prev)}
        >
          <div className="adv-left">
            <span className="adv-tag">ADV</span>
            <span className="adv-label">Advanced Metrics</span>
          </div>
          <span className={`adv-chevron ${showAdv ? 'expanded' : ''}`}>▼</span>
        </button>

        {showAdv && (
          <div className="adv-controls-container">
            {/* Custom Reliability Threshold Slider */}
            <div className="threshold-control-card">
              <div className="threshold-header">
                <span className="threshold-title">Target Reliability Benchmark</span>
                <span className="threshold-val">{reliabilityThreshold}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="1"
                value={reliabilityThreshold}
                onChange={(e) => setReliabilityThreshold(Number(e.target.value))}
                className="threshold-slider"
              />
              <div className="threshold-labels">
                <span>40% (Low)</span>
                <span>Target: {reliabilityThreshold}%</span>
                <span>95% (Strict)</span>
              </div>
            </div>

            <div className="metrics-selector-header">
              <span>Active Gauging Metrics ({selectedMetricLabels.length}/5)</span>
            </div>

            <div className="trust-metrics-scroll">
              {trustMetrics.map(({ label, description, weight, value }) => {
                const isSelected = selectedMetricLabels.includes(label);
                return (
                  <div key={label} className={`trust-metric ${!isSelected ? 'disabled-metric' : ''}`}>
                    <div className="metric-select-row">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMetricSelection(label)}
                        className="metric-checkbox"
                        id={`metric-check-${label.replace(/\s+/g, '-')}`}
                      />
                      <label htmlFor={`metric-check-${label.replace(/\s+/g, '-')}`} className="metric-meta-wrapper">
                        <div className="metric-meta">
                          <div>
                            <span className="metric-label">{label}</span>
                            {description && <p className="metric-desc">{description}</p>}
                          </div>
                          <span className="metric-value">{Math.round(value)}%</span>
                        </div>
                      </label>
                    </div>

                    {isSelected && (
                      <>
                        <div className="metric-scale">
                          <div className="metric-fill" style={{ width: `${value}%` }} />
                        </div>
                        <div className="metric-weight">Weight: {weight}%</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  const renderAuthView = () => (
    <div className={`page-shell auth-shell ${theme}`} data-theme={theme}>
      <div className="background">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="orb orb-three" />
      </div>

      <div className="auth-card">
        <div className="brand-block">
          <p className="eyebrow">AI powered insight workspace</p>
          <h1>CLARIO-1</h1>
          <p className="subtitle">
            {isLogin
              ? 'Welcome back. Sign in to continue your analysis with calm confidence.'
              : 'Create your account and begin exploring CLARIO-1 in a secure, fluid workspace.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <label>
              Full Name
              <input
                type="text"
                name="name"
                placeholder="Alicia Chen"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" className="primary-btn">
            {isLogin ? 'Login' : 'Create account'}
          </button>
        </form>

        <div className="switch-row">
          <span>{isLogin ? 'New here?' : 'Already have an account?'}</span>
          <button type="button" className="link-btn" onClick={() => setIsLogin((prev) => !prev)}>
            {isLogin ? 'Create account' : 'Login'}
          </button>
        </div>

        <div className="switch-row top-gap">
          <span>Need a guided workspace?</span>
          <button type="button" className="link-btn" onClick={() => setView('chatbot')}>
            Open chatbot
          </button>
        </div>

        <div className="trust-footer">
          <span>Privacy-alerts</span>
          <span>Flexible access</span>
          <span>Human-centered AI</span>
        </div>
      </div>
    </div>
  );

  const renderChatbotView = () => (
    <div
      className={`page-shell chatbot-shell ${theme} ${a11yModes.dyslexia ? 'a11y-dyslexia' : ''} ${a11yModes.adhd ? 'a11y-adhd' : ''} ${a11yModes.highContrast ? 'a11y-high-contrast' : ''} ${a11yModes.largeText ? 'a11y-large-text' : ''}`}
      data-theme={theme}
    >
      <div className="background">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="orb orb-three" />
      </div>

      <div className="chatbot-container">
        <div className="mobile-nav-tabs">
          <button
            type="button"
            className={`mobile-tab-btn ${mobileTab === 'topics' ? 'active' : ''}`}
            onClick={() => setMobileTab('topics')}
          >
            Topics
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
            onClick={() => setMobileTab('chat')}
          >
            Chat
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${mobileTab === 'trust' ? 'active' : ''}`}
            onClick={() => setMobileTab('trust')}
          >
            Trust Panel
          </button>
        </div>

        <div className="chatbot-card">
          <aside className={`sidebar ${mobileTab !== 'topics' ? 'mobile-hidden' : ''}`}>
            <div className="sidebar-top">
              <div className="brand-block compact">
                <div className="logo-mark">C</div>
                <div>
                  <h2>CLARIO-1</h2>
                  <p>Insight assistant</p>
                </div>
              </div>

              <div className="sidebar-section">
                <p className="sidebar-label">Recent topics</p>
                <div className="topics-list">
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      className={`topic-item ${activeTopic === topic ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTopic(topic);
                        setMobileTab('chat');
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="accessibility-panel">
              <div className="a11y-header">
                <span className="a11y-icon">♿</span>
                <span className="a11y-title">Accessibility</span>
              </div>
              <div className="a11y-options-grid">
                <button
                  type="button"
                  className={`a11y-btn ${a11yModes.dyslexia ? 'active' : ''}`}
                  onClick={() => toggleA11y('dyslexia')}
                  title="Dyslexia Friendly Font & Spacing"
                >
                  <span className="a11y-tag">Aa</span>
                  <span>Dyslexia</span>
                </button>
                <button
                  type="button"
                  className={`a11y-btn ${a11yModes.adhd ? 'active' : ''}`}
                  onClick={() => toggleA11y('adhd')}
                  title="ADHD Focus Mode - High Focus & Minimal Distractions"
                >
                  <span className="a11y-tag">🎯</span>
                  <span>ADHD Focus</span>
                </button>
                <button
                  type="button"
                  className={`a11y-btn ${a11yModes.highContrast ? 'active' : ''}`}
                  onClick={() => toggleA11y('highContrast')}
                  title="High Contrast Mode for Visual Clarity"
                >
                  <span className="a11y-tag">👁️</span>
                  <span>Contrast</span>
                </button>
                <button
                  type="button"
                  className={`a11y-btn ${a11yModes.largeText ? 'active' : ''}`}
                  onClick={() => toggleA11y('largeText')}
                  title="Increase Text Font Size"
                >
                  <span className="a11y-tag">A+</span>
                  <span>Large Text</span>
                </button>
              </div>
            </div>

            <div className="sidebar-profile">
              <div
                className="profile-card clickable-profile"
                onClick={() => setShowProfileModal(true)}
                title="Click to view User Profile, Details & Chat History"
              >
                <div className="avatar">
                  {(formData.name || 'Alicia Chen').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="profile-text-group">
                  <p className="profile-name">{formData.name || 'Alicia Chen'}</p>
                  <p className="profile-email-sub">{formData.email || 'alicia@clario.ai'}</p>
                </div>
                <span className="profile-gear-icon" title="Account Settings">⚙️</span>
              </div>
            </div>
          </aside>

          <main className={`chat-main ${mobileTab !== 'chat' ? 'mobile-hidden' : ''}`}>
            {messages.length > 0 && (
              <div className="chat-top-actions">
                <span className="chat-msg-count">{messages.length} messages in active session</span>
                <button
                  type="button"
                  className="clear-chat-btn"
                  onClick={handleClearChat}
                  title="Clear all messages in active session"
                >
                  🗑️ Clear Chat
                </button>
              </div>
            )}

            <section className={`chat-window ${!messages.some((m) => m.sender === 'user') ? 'centered-hero' : ''}`}>
              {!messages.some((m) => m.sender === 'user') ? (
                <div className="chat-tagline-hero">
                  <span className="tagline-badge-hero">CLARIO-1</span>
                  <h1 className="chat-tagline-text-hero">
                    Hey there! Gauge the reliability of AI reasoning
                  </h1>
                  <p className="chat-tagline-subtext">
                    Explore real-time XAI confidence scores, vector fidelity, and neural reasoning traces as you chat.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`bubble ${message.sender}`}>
                    <p>{message.text}</p>
                  </div>
                ))
              )}
            </section>

            <form className="composer" onSubmit={handleSend}>
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about trust, reasoning, or your next insight..."
              />
              <button type="submit" className="primary-btn compact-btn">
                Send
              </button>
            </form>
          </main>

          <aside className={`trust-column ${mobileTab !== 'trust' ? 'mobile-hidden' : ''}`}>
            {renderTrustPanel()}
          </aside>
        </div>
      </div>

      {/* User Profile & Account Details Modal */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-user-identity">
                <div className="avatar modal-avatar">
                  {(formData.name || 'Alicia Chen').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="modal-user-name">{formData.name || 'Alicia Chen'}</h3>
                  <p className="modal-user-email">{formData.email || 'alicia.chen@clario.ai'}</p>
                  <span className="user-role-badge">Verified XAI Analyst</span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowProfileModal(false)}
                title="Close Modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="profile-details-section">
                <h4>Account Details</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-lbl">Full Name</span>
                    <span className="info-val">{formData.name || 'Alicia Chen'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-lbl">Email Address</span>
                    <span className="info-val">{formData.email || 'alicia.chen@clario.ai'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-lbl">Workspace Plan</span>
                    <span className="info-val">Enterprise XAI Pro</span>
                  </div>
                  <div className="info-item">
                    <span className="info-lbl">Active Topic</span>
                    <span className="info-val">{activeTopic}</span>
                  </div>
                </div>
              </div>

              <div className="profile-history-section">
                <div className="history-header">
                  <h4>Session Chat History ({messages.length})</h4>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      className="danger-btn-sm"
                      onClick={handleClearChat}
                    >
                      🗑️ Clear All Chat
                    </button>
                  )}
                </div>

                <div className="history-list-scroll">
                  {messages.length === 0 ? (
                    <p className="empty-history-text">No active chat history in this session.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className="history-item">
                        <div className="history-item-content">
                          <span className={`history-sender-tag ${m.sender}`}>
                            {m.sender === 'user' ? 'You' : 'CLARIO-1'}
                          </span>
                          <p className="history-snippet">{m.text}</p>
                        </div>
                        <button
                          type="button"
                          className="delete-msg-btn"
                          onClick={() => handleDeleteMessage(m.id)}
                          title="Delete message"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setShowProfileModal(false);
                  setView('auth');
                }}
              >
                Log out
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => setShowProfileModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return view === 'chatbot' ? renderChatbotView() : renderAuthView();
}

export default App;
