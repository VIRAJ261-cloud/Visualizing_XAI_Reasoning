import { useState, useEffect } from 'react';

const initialTrustMetrics = [
  { label: 'Self-consistency', weight: 25, value: 84 },
  { label: 'Semantic agreement', weight: 25, value: 71 },
  { label: 'Source quality', weight: 20, value: 65 },
  { label: 'Retrieval completeness', weight: 15, value: 88 },
  { label: 'External verification', weight: 10, value: 59 }
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

  const totalWeight = trustMetrics.reduce((acc, m) => acc + m.weight, 0);
  const cumulativeTrustScore = Math.round(
    trustMetrics.reduce((acc, m) => acc + m.value * m.weight, 0) / (totalWeight || 1)
  );

  const crystalState = cumulativeTrustScore >= 80 ? 'radiant' : cumulativeTrustScore >= 60 ? 'harmonizing' : 'fractured';

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
          <div className="trust-metrics-scroll">
            {trustMetrics.map(({ label, weight, value }) => (
              <div key={label} className="trust-metric">
                <div className="metric-meta">
                  <span className="metric-label">{label}</span>
                  <span className="metric-value">{Math.round(value)}%</span>
                </div>
                <div className="metric-scale">
                  <div className="metric-fill" style={{ width: `${value}%` }} />
                </div>
                <div className="metric-weight">Weight: {weight}%</div>
              </div>
            ))}
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
    <div className={`page-shell chatbot-shell ${theme}`} data-theme={theme}>
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

            <div className="sidebar-profile">
              <div className="profile-card">
                <div className="avatar">AC</div>
                <div>
                  <p className="profile-name">Alicia Chen</p>
                  <button type="button" className="link-btn small" onClick={() => setView('auth')}>
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <main className={`chat-main ${mobileTab !== 'chat' ? 'mobile-hidden' : ''}`}>
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
    </div>
  );

  return view === 'chatbot' ? renderChatbotView() : renderAuthView();
}

export default App;
