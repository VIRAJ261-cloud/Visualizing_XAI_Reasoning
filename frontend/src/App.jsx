import { useState } from 'react';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [view, setView] = useState('auth');
  const [activeTopic, setActiveTopic] = useState('Trust analysis');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Welcome to CLARIO-1. I can help summarize trust, explain reasoning, or review your latest insights.' },
    { id: 2, sender: 'user', text: 'Show me the current trust status.' }
  ]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const topics = ['Trust analysis', 'Model summary', 'Explainability', 'Next actions'];

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
    setDraft('');
  };

  const renderAuthView = () => (
    <div className="page-shell">
      <div className="background">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="orb orb-three" />
      </div>

      <div className="auth-card">
        <div className="brand-block">
          <div className="pill-row">
            <span className="trust-pill">Trusted by teams</span>
            <span className="trust-pill soft">Secure by design</span>
          </div>
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
          <span>Privacy-first</span>
          <span>Flexible access</span>
          <span>Human-centered AI</span>
        </div>
      </div>
    </div>
  );

  const renderChatbotView = () => (
    <div className="page-shell chatbot-shell">
      <div className="background">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="orb orb-three" />
      </div>

      <div className="chatbot-card">
        <aside className="sidebar">
          <div className="brand-block compact">
            <div className="logo-mark">C</div>
            <div>
              <h2>CLARIO-1</h2>
              <p>Insight assistant</p>
            </div>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-label">Recent topics</p>
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                className={`topic-item ${activeTopic === topic ? 'active' : ''}`}
                onClick={() => setActiveTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </aside>

        <main className="chat-main">
          <header className="chat-header">
            <div>
              <p className="eyebrow">Live conversation</p>
              <h3>{activeTopic}</h3>
            </div>
            <div className="profile-row">
              <div className="avatar">AC</div>
              <div>
                <p className="profile-name">Alicia Chen</p>
                <button type="button" className="link-btn small" onClick={() => setView('auth')}>
                  Log out
                </button>
              </div>
            </div>
          </header>

          <section className="chat-window">
            {messages.map((message) => (
              <div key={message.id} className={`bubble ${message.sender}`}>
                <p>{message.text}</p>
              </div>
            ))}
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
      </div>
    </div>
  );

  return view === 'chatbot' ? renderChatbotView() : renderAuthView();
}

export default App;
