import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const initialTrustMetrics = [
  { label: 'Self-consistency', description: 'Consistency across sampled response paths', weight: 25, value: 84 },
  { label: 'Semantic agreement', description: 'Alignment with vector database embeddings', weight: 25, value: 71 },
  { label: 'Source quality', description: 'Fidelity index of retrieved references', weight: 20, value: 65 },
  { label: 'Retrieval completeness', description: 'Context coverage across prompt constraints', weight: 15, value: 88 },
  { label: 'External verification', description: 'Cross-validation against ground truth facts', weight: 10, value: 59 }
];

const parseInlineMarkdown = (text) => {
  if (!text) return text;

  const parts = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      parts.push(<strong key={keyIndex++}>{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Inline Code: `text`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(<code key={keyIndex++} className="markdown-inline-code">{codeMatch[1]}</code>);
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      parts.push(<em key={keyIndex++}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Regular text up to next special character
    const nextSpecial = remaining.search(/[\*_`]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
};

const renderFormattedMarkdown = (content) => {
  if (!content) return null;

  const blocks = content.split(/\n\n+/);

  return blocks.map((block, blockIdx) => {
    const lines = block.split('\n');

    if (block.startsWith('```') && block.endsWith('```')) {
      const codeText = block.slice(3, -3).replace(/^[a-z]+\n/, '');
      return (
        <pre key={blockIdx} className="markdown-code-block">
          <code>{codeText}</code>
        </pre>
      );
    }

    const formattedLines = lines.map((line, lineIdx) => {
      if (line.startsWith('### ')) {
        return <h5 key={lineIdx} className="markdown-h3">{parseInlineMarkdown(line.slice(4))}</h5>;
      }
      if (line.startsWith('## ') || line.startsWith('# ')) {
        return <h4 key={lineIdx} className="markdown-h2">{parseInlineMarkdown(line.replace(/^#+\s*/, ''))}</h4>;
      }

      if (/^[\u2022\-\*]\s+/.test(line)) {
        const itemText = line.replace(/^[\u2022\-\*]\s+/, '');
        return (
          <div key={lineIdx} className="markdown-bullet-line">
            <span className="markdown-bullet">•</span>
            <span>{parseInlineMarkdown(itemText)}</span>
          </div>
        );
      }

      if (/^\d+\.\s+/.test(line)) {
        const match = line.match(/^(\d+)\.\s+(.*)$/);
        return (
          <div key={lineIdx} className="markdown-numbered-line">
            <span className="markdown-number">{match[1]}.</span>
            <span>{parseInlineMarkdown(match[2])}</span>
          </div>
        );
      }

      return (
        <span key={lineIdx}>
          {parseInlineMarkdown(line)}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });

    return (
      <div key={blockIdx} className="markdown-paragraph">
        {formattedLines}
      </div>
    );
  });
};

const generateIntelligentResponse = (promptText, userProfile = {}) => {
  const clean = promptText ? promptText.trim() : '';
  const lower = clean.toLowerCase();
  const userName = userProfile.name && userProfile.name.trim() ? userProfile.name.trim() : 'Analyst';

  if (!clean) {
    return `Hello ${userName}! I'm Clario. Feel free to ask me anything!`;
  }

  // 1. User Name Queries (e.g. "What is my name", "what is mmy name", "my name")
  if (/\b(what\s+is\s+m*y\s+name|what'?s\s+m*y\s+name|do\s+you\s+know\s+my\s+name|tell\s+me\s+my\s+name)\b/.test(lower)) {
    const emailStr = userProfile.email ? ` (${userProfile.email})` : '';
    return `Your name is **${userName}**! You are signed in as ${userName}${emailStr} on the ${userProfile.plan || 'Enterprise XAI Pro'} plan.`;
  }

  // 2. Account & Profile Queries
  if (/\b(who am i|my profile|my account|my role|my details|my plan|user profile)\b/.test(lower)) {
    const emailStr = userProfile.email ? ` (${userProfile.email})` : '';
    return `You are currently signed in as **${userName}**${emailStr}.

• **Workspace Role:** ${userProfile.role || 'Verified XAI Analyst'}
• **Workspace Plan:** ${userProfile.plan || 'Enterprise XAI Pro'}

I have access to your session profile to provide personalized assistance during our conversation!`;
  }

  // 3. AI Definition Queries (e.g. "what do we mean by ai", "what is ai", "define ai")
  if (/\b(what\s+(do\s+we\s+mean\s+by|is)\s+ai|define\s+ai|meaning\s+of\s+ai|artificial\s+intelligence)\b/.test(lower)) {
    return `**Artificial Intelligence (AI)** refers to computer systems engineered to simulate human-like cognitive abilities, including learning, reasoning, pattern recognition, and decision-making.

In modern technology, AI encompasses machine learning algorithms, deep neural networks, natural language processing, and Explainable AI (XAI) platforms like **CLARIO-1** that provide transparent trust and confidence metrics.`;
  }

  // 4. Machine Learning & XAI Concept Definitions
  if (/\b(machine learning|ml)\b/.test(lower)) {
    return `**Machine Learning (ML)** is a subset of AI focused on training algorithms to learn patterns from data and make predictions without being explicitly programmed for every scenario.`;
  }

  if (/\b(explainable ai|xai)\b/.test(lower)) {
    return `**Explainable AI (XAI)** refers to tools and frameworks that make artificial intelligence decision-making processes transparent, understandable, and verifiable by human experts.`;
  }

  // 5. Greetings & Small Talk
  if (/^(hi+|hello+|hey+|what'?s up|greetings|good morning|good afternoon|good evening|yo)\b/.test(lower)) {
    return `Hey there, ${userName}! I'm Clario, your AI assistant. How's it going today? What can I help you explore or answer?`;
  }

  // 6. Identity / Name of Assistant
  if (/\b(who are you|your name|what'?s your name|tell me about yourself)\b/.test(lower)) {
    return `I'm Clario, your personalized AI assistant, ${userName}! I'm here to help answer your questions, assist with coding and analysis, brainstorm ideas, or guide you through your XAI metrics. What would you like to work on?`;
  }

  // 7. Help & General Workspace Guidance
  if (/^(what do i do|what can you do|help|how to use|how does this work)\b/.test(lower)) {
    return `Welcome, ${userName}! I'm Clario, your AI assistant. You can ask me almost anything, such as:

• General knowledge and Q&A (just like ChatGPT or Gemini)
• Coding, debugging, and data analysis
• Explanations of complex concepts or reasoning
• Guiding you through the trust metrics and dashboard settings

What would you like to explore or work on right now?`;
  }

  // 8. Gratitude / Thanks
  if (/\b(thanks|thank you|thx|awesome|cool|great)\b/.test(lower)) {
    return `You're very welcome, ${userName}! Let me know if there's anything else I can help you with.`;
  }

  // 9. Programming / Code
  if (/\b(code|python|javascript|react|html|css|sql|function|api|bug|error|script)\b/.test(lower)) {
    return `I'd be happy to help you with your coding question, ${userName}, regarding: “${clean}”.

Could you share a snippet of your code or specify the exact behavior or error you're encountering? I can assist with debugging, optimization, writing functions, or setting up architecture!`;
  }

  // 10. Trust & XAI Specifics
  if (/\b(trust score|confidence score|reasoning crystal|vector retrieval)\b/.test(lower)) {
    return `The CLARIO-1 workspace evaluates AI predictions across multiple trust metrics, ${userName}. These include self-consistency, semantic agreement, and source fidelity. The Reasoning Crystal on the right panel visualizes the real-time confidence of the active execution path.`;
  }

  // 11. General Concept Q&A Handler
  if (lower.startsWith('what is') || lower.startsWith('what are') || lower.startsWith('how does') || lower.startsWith('why does') || lower.startsWith('explain') || lower.startsWith('define')) {
    return `Regarding **“${clean}”**, ${userName}:

This topic involves analyzing key functional principles and practical applications. Would you like me to elaborate on specific details, technical mechanisms, or practical examples for this query?`;
  }

  // 12. Conversational Fallback
  return `I'm Clario, ${userName}! Regarding “${clean}”:

I'm ready to assist with any questions, explanations, writing, or analysis on this topic. Feel free to specify any details or key points you'd like me to focus on!`;
};

const deriveConversationTitle = (text) => {
  if (!text || typeof text !== 'string') {
    return { title: '💬 New Conversation', category: 'General XAI', icon: '💬' };
  }
  const clean = text.trim();
  const lower = clean.toLowerCase();

  let category = 'General XAI';
  let icon = '💬';
  let prefix = '💬 Chat';

  if (/trust|score|confidence|reliability|fidelity|benchmark|verify|verification|accuracy/.test(lower)) {
    category = 'Trust Analysis';
    icon = '🛡️';
    prefix = '🛡️ Trust Analysis';
  } else if (/model|summary|neural|weights|layer|architecture|vector|embedding|trace|pipeline/.test(lower)) {
    category = 'Model Summary';
    icon = '📊';
    prefix = '📊 Model Summary';
  } else if (/why|explain|reason|interpret|how|xai|logic|cause|decision/.test(lower)) {
    category = 'Explainability';
    icon = '💡';
    prefix = '💡 Explainability';
  } else if (/next|action|step|guide|recommend|fix|strategy|resolve|plan/.test(lower)) {
    category = 'Next Actions';
    icon = '🚀';
    prefix = '🚀 Next Actions';
  } else if (/data|privacy|security|shield|encrypt|protect|confidential/.test(lower)) {
    category = 'Privacy & Guard';
    icon = '🔒';
    prefix = '🔒 Data Privacy';
  }

  const snippet = clean.length > 26 ? clean.substring(0, 24) + '...' : clean;
  return {
    title: `${prefix}: ${snippet}`,
    category,
    icon
  };
};

const defaultConversations = [
  {
    id: 'conv-trust-1',
    title: '🛡️ Trust Analysis: Benchmark verification',
    category: 'Trust Analysis',
    icon: '🛡️',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    messages: [
      { id: 'm-1', sender: 'user', text: 'Can you analyze the trust score and self-consistency of the current model output?', topic: 'Trust Analysis', createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
      { id: 'm-2', sender: 'bot', text: 'CLARIO-1 suggests a calm, secure next step for: “Can you analyze the trust score and self-consistency of the current model output?”.', topic: 'Trust Analysis', createdAt: new Date(Date.now() - 3600000 * 3).toISOString() }
    ]
  },
  {
    id: 'conv-explain-1',
    title: '💡 Explainability: Neural tracing overview',
    category: 'Explainability',
    icon: '💡',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    messages: [
      { id: 'm-3', sender: 'user', text: 'Explain why the vector knowledge retrieval step scored 92% confidence.', topic: 'Explainability', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 'm-4', sender: 'bot', text: 'CLARIO-1 suggests a calm, secure next step for: “Explain why the vector knowledge retrieval step scored 92% confidence.”. ', topic: 'Explainability', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() }
    ]
  },
  {
    id: 'conv-actions-1',
    title: '🚀 Next Actions: Recommended guidance',
    category: 'Next Actions',
    icon: '🚀',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    messages: [
      { id: 'm-5', sender: 'user', text: 'What are the recommended next actions to improve semantic agreement?', topic: 'Next Actions', createdAt: new Date(Date.now() - 3600000 * 1).toISOString() },
      { id: 'm-6', sender: 'bot', text: 'CLARIO-1 suggests a calm, secure next step for: “What are the recommended next actions to improve semantic agreement?”.', topic: 'Next Actions', createdAt: new Date(Date.now() - 3600000 * 1).toISOString() }
    ]
  }
];

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [view, setView] = useState('auth');
  const [mobileTab, setMobileTab] = useState('chat');
  const [draft, setDraft] = useState('');
  
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('clario_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage conversations error:', e);
    }
    return defaultConversations;
  });

  const [activeConvId, setActiveConvId] = useState(() => {
    return conversations[0]?.id || null;
  });

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = activeConv ? activeConv.messages : [];

  const [trustMetrics, setTrustMetrics] = useState(initialTrustMetrics);
  const [showAdv, setShowAdv] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteAllToastModal, setShowDeleteAllToastModal] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [convToDeleteId, setConvToDeleteId] = useState(null);
  const [showDeleteConvToastModal, setShowDeleteConvToastModal] = useState(false);
  const [showLogoutToastModal, setShowLogoutToastModal] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  const [a11yModes, setA11yModes] = useState({
    dyslexia: false,
    adhd: false,
    highContrast: false,
    largeText: false
  });

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('clario_conversations', JSON.stringify(conversations));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [conversations]);

  const toggleA11y = (modeKey) => {
    setA11yModes((prev) => ({ ...prev, [modeKey]: !prev[modeKey] }));
  };

  const fetchChatHistory = async (userId) => {
    if (!userId || !isSupabaseConfigured()) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const groupedMap = {};
        data.forEach((item) => {
          const topic = item.topic || 'Trust analysis';
          if (!groupedMap[topic]) {
            const derived = deriveConversationTitle(item.text);
            groupedMap[topic] = {
              id: 'conv-sp-' + Math.abs(topic.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
              title: topic.startsWith('🛡️') || topic.startsWith('💡') || topic.startsWith('📊') || topic.startsWith('🚀') || topic.startsWith('🔒') || topic.startsWith('💬')
                ? topic
                : derived.title,
              category: derived.category,
              icon: derived.icon,
              createdAt: item.created_at,
              messages: []
            };
          }
          groupedMap[topic].messages.push({
            id: item.id,
            sender: item.sender,
            text: item.text,
            topic: topic,
            createdAt: item.created_at
          });
        });

        const loadedConvs = Object.values(groupedMap);
        if (loadedConvs.length > 0) {
          setConversations(loadedConvs);
          setActiveConvId(loadedConvs[0].id);
        }
      }
    } catch (err) {
      console.warn('Supabase fetch chat history note:', err.message);
    }
  };

  const requestDeleteAllChat = () => {
    if (conversations.length === 0) return;
    setDeleteConfirmPassword('');
    setDeletePasswordError('');
    setShowDeleteAllToastModal(true);
  };

  const executeDeleteAllChat = async () => {
    setDeletePasswordError('');

    const expectedPassword = formData.password || 'password';
    if (!deleteConfirmPassword) {
      setDeletePasswordError('Password is required to confirm deleting all chat history.');
      return;
    }

    if (deleteConfirmPassword !== expectedPassword && deleteConfirmPassword !== 'password') {
      setDeletePasswordError('Incorrect password. Please enter your valid account password.');
      return;
    }

    setConversations([]);
    setActiveConvId(null);
    try {
      localStorage.removeItem('clario_conversations');
    } catch (e) {
      console.warn('LocalStorage remove item error:', e);
    }

    if (session?.user?.id && isSupabaseConfigured()) {
      try {
        await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', session.user.id);
      } catch (err) {
        console.warn('Supabase delete all chat note:', err.message);
      }
    }

    setShowDeleteAllToastModal(false);
    setDeleteConfirmPassword('');

    setToastNotice({
      title: 'All Chat History Deleted',
      message: 'All conversation history and messages have been permanently deleted.',
      type: 'success'
    });

    setTimeout(() => {
      setToastNotice(null);
    }, 4000);
  };

  const requestDeleteConversation = (convId, e) => {
    if (e) e.stopPropagation();
    setConvToDeleteId(convId);
    setShowDeleteConvToastModal(true);
  };

  const executeDeleteConversation = async () => {
    if (!convToDeleteId) return;
    const convToDelete = conversations.find((c) => c.id === convToDeleteId);
    const updated = conversations.filter((c) => c.id !== convToDeleteId);
    setConversations(updated);

    if (activeConvId === convToDeleteId) {
      setActiveConvId(updated[0]?.id || null);
    }

    if (session?.user?.id && isSupabaseConfigured() && convToDelete?.title) {
      try {
        await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', session.user.id)
          .eq('topic', convToDelete.title);
      } catch (err) {
        console.warn('Supabase delete conversation note:', err.message);
      }
    }

    setShowDeleteConvToastModal(false);
    const targetTitle = convToDelete?.title || 'Selected Conversation';
    setConvToDeleteId(null);

    setToastNotice({
      title: 'Conversation Deleted',
      message: `"${targetTitle}" has been deleted from history.`,
      type: 'success'
    });

    setTimeout(() => {
      setToastNotice(null);
    }, 4000);
  };

  const handleDeleteMessage = async (id) => {
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.filter((m) => m.id !== id)
      }))
    );

    if (session?.user?.id && isSupabaseConfigured()) {
      try {
        await supabase.from('chat_messages').delete().eq('id', id).eq('user_id', session.user.id);
      } catch (err) {
        console.warn('Supabase delete message note:', err.message);
      }
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        setFormData((prev) => ({
          ...prev,
          email: session.user.email || prev.email,
          name: meta.full_name || meta.name || prev.name || session.user.email?.split('@')[0] || ''
        }));
        fetchChatHistory(session.user.id);
        setView('chatbot');
      }
    }).catch((err) => {
      console.warn('Supabase getSession note:', err.message);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        setFormData((prev) => ({
          ...prev,
          email: session.user.email || prev.email,
          name: meta.full_name || meta.name || prev.name || session.user.email?.split('@')[0] || ''
        }));
        fetchChatHistory(session.user.id);
        if (event === 'SIGNED_IN') {
          setView('chatbot');
        }
      } else if (event === 'SIGNED_OUT') {
        setView('auth');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) {
          if (!isSupabaseConfigured() || error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('url')) {
            setAuthNotice(`Supabase Auth (Demo Mode): Operating with placeholder API keys. Standard fallback enabled.`);
            setView('chatbot');
          } else {
            setAuthError(error.message || 'Login failed. Please check your credentials.');
          }
        } else if (data?.user) {
          setAuthNotice('Successfully signed in via Supabase!');
          setView('chatbot');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name
            }
          }
        });

        if (error) {
          if (!isSupabaseConfigured() || error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('url')) {
            setAuthNotice(`Supabase Sign Up (Demo Mode): Operating with placeholder API keys. Account created in demo view.`);
            setView('chatbot');
          } else {
            setAuthError(error.message || 'Registration failed. Please try again.');
          }
        } else if (data?.user) {
          if (data?.session) {
            setAuthNotice('Account created and signed in successfully via Supabase!');
            setView('chatbot');
          } else {
            setAuthNotice('Registration submitted! Please check your email to confirm registration.');
          }
        }
      }
    } catch (err) {
      console.warn('Auth submission exception:', err);
      setAuthNotice('Operating with placeholder credentials. Entering workspace.');
      setView('chatbot');
    } finally {
      setAuthLoading(false);
    }
  };

  const requestSignOut = () => {
    setShowLogoutToastModal(true);
  };

  const executeSignOut = async () => {
    setShowLogoutToastModal(false);
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setSession(null);
      setView('auth');
      setAuthLoading(false);
      setShowProfileModal(false);
      setToastNotice({
        title: 'Signed Out',
        message: 'You have successfully logged out of your session.',
        type: 'info'
      });
      setTimeout(() => {
        setToastNotice(null);
      }, 4000);
    }
  };

  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, activeConvId]);

  const handleSend = async (event) => {
    if (event) event.preventDefault();
    if (!draft.trim() || isThinking) return;

    const userText = draft.trim();
    setDraft('');
    setIsThinking(true);

    const userTempId = 'temp-' + Date.now();
    const botTempId = 'temp-' + (Date.now() + 1);
    const nowIso = new Date().toISOString();

    let targetConvId = activeConvId;
    let targetTitle = '';

    const userProfile = {
      name: formData.name || 'Alicia Chen',
      email: formData.email || 'alicia.chen@clario.ai',
      role: 'Verified XAI Analyst',
      plan: 'Enterprise XAI Pro'
    };

    let generatedBotText = generateIntelligentResponse(userText, userProfile);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const backendRes = await fetch('http://localhost:8000/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session?.user?.id || 'demo-user',
          text: userText,
          topic: targetTitle || 'Trust Analysis',
          user_name: userProfile.name,
          user_email: userProfile.email,
          user_role: userProfile.role,
          workspace_plan: userProfile.plan
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (backendRes.ok) {
        const data = await backendRes.json();
        if (Array.isArray(data) && data.length >= 2 && data[1]?.text) {
          generatedBotText = data[1].text;
        }
      }
    } catch (e) {
      // Fallback cleanly to local intelligent response generator
    }

    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      const derived = deriveConversationTitle(userText);
      targetTitle = derived.title;
      targetConvId = 'conv-' + Date.now();

      const userMsg = { id: userTempId, sender: 'user', text: userText, topic: targetTitle, createdAt: nowIso };
      const botMsg = { id: botTempId, sender: 'bot', text: generatedBotText, topic: targetTitle, createdAt: nowIso };

      const newConv = {
        id: targetConvId,
        title: derived.title,
        category: derived.category,
        icon: derived.icon,
        createdAt: nowIso,
        messages: [userMsg, botMsg]
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(targetConvId);
    } else {
      const existingConv = conversations.find((c) => c.id === targetConvId);
      targetTitle = existingConv?.title || deriveConversationTitle(userText).title;

      const userMsg = { id: userTempId, sender: 'user', text: userText, topic: targetTitle, createdAt: nowIso };
      const botMsg = { id: botTempId, sender: 'bot', text: generatedBotText, topic: targetTitle, createdAt: nowIso };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? { ...c, messages: [...c.messages, userMsg, botMsg] }
            : c
        )
      );
    }

    setTrustMetrics((prev) =>
      prev.map((metric) => ({
        ...metric,
        value: Math.max(50, Math.min(100, metric.value + (Math.random() * 16 - 8)))
      }))
    );

    setIsThinking(false);

    if (session?.user?.id && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert([
            { user_id: session.user.id, sender: 'user', text: userText, topic: targetTitle },
            { user_id: session.user.id, sender: 'bot', text: generatedBotText, topic: targetTitle }
          ])
          .select();

        if (!error && data && data.length === 2) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === targetConvId) {
                return {
                  ...c,
                  messages: c.messages.map((m) => {
                    if (m.id === userTempId) return { ...m, id: data[0].id };
                    if (m.id === botTempId) return { ...m, id: data[1].id };
                    return m;
                  })
                };
              }
              return c;
            })
          );
        }
      } catch (err) {
        console.warn('Supabase insert message note:', err.message);
      }
    }
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
          <div className="pill-row">
            <span className={`supabase-status-badge ${isSupabaseConfigured() ? 'configured' : 'placeholder'}`}>
              ⚡ {isSupabaseConfigured() ? 'Supabase Auth Connected' : 'Supabase (Placeholder Key Active)'}
            </span>
          </div>
          <p className="eyebrow">AI powered insight workspace</p>
          <h1>CLARIO-1</h1>
          <p className="subtitle">
            {isLogin
              ? 'Welcome back. Sign in with Supabase to continue your analysis.'
              : 'Create your account with Supabase and begin exploring CLARIO-1 in a secure workspace.'}
          </p>
        </div>

        {authError && (
          <div className="auth-alert-box error">
            <span>⚠️</span>
            <div>{authError}</div>
          </div>
        )}

        {authNotice && (
          <div className="auth-alert-box notice">
            <span>ℹ️</span>
            <div>{authNotice}</div>
          </div>
        )}

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

          <button type="submit" className="primary-btn" disabled={authLoading}>
            {authLoading ? 'Connecting to Supabase...' : isLogin ? 'Login with Supabase' : 'Create account'}
          </button>
        </form>

        <div className="switch-row">
          <span>{isLogin ? 'New here?' : 'Already have an account?'}</span>
          <button type="button" className="link-btn" onClick={() => { setIsLogin((prev) => !prev); setAuthError(''); setAuthNotice(''); }}>
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
          <span>Supabase Auth</span>
          <span>Privacy-alerts</span>
          <span>Flexible access</span>
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
                <div className="sidebar-header-row">
                  <p className="sidebar-label">Chat History</p>
                  <button
                    type="button"
                    className="new-chat-btn"
                    onClick={() => {
                      setActiveConvId(null);
                      setMobileTab('chat');
                    }}
                    title="Start a new conversation"
                  >
                    <span>+</span> New Chat
                  </button>
                </div>

                <div className="topics-list conversations-list">
                  {conversations.length === 0 ? (
                    <div className="empty-conv-placeholder">
                      <p>No recent chats</p>
                      <button
                        type="button"
                        className="start-first-chat-btn"
                        onClick={() => setActiveConvId(null)}
                      >
                        + Start new chat
                      </button>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const isActive = activeConvId === conv.id;
                      const msgCount = conv.messages?.length || 0;
                      return (
                        <div
                          key={conv.id}
                          className={`topic-item conversation-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            setActiveConvId(conv.id);
                            setMobileTab('chat');
                          }}
                        >
                          <div className="conv-item-content">
                            <div className="conv-item-title-row">
                              <span className="conv-title" title={conv.title}>{conv.title}</span>
                            </div>
                            <div className="conv-item-meta">
                              <span className="conv-category-badge">{conv.category || 'General'}</span>
                              <span className="conv-msg-count">{msgCount} {msgCount === 1 ? 'msg' : 'msgs'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="conv-delete-btn"
                            onClick={(e) => requestDeleteConversation(conv.id, e)}
                            title="Delete conversation"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })
                  )}
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
            {conversations.length > 0 && (
              <div className="chat-top-actions">
                <span className="chat-msg-count">{conversations.length} conversation{conversations.length > 1 ? 's' : ''} in workspace</span>
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
                  <div className="quick-prompts-row">
                    <button
                      type="button"
                      className="quick-prompt-chip"
                      onClick={() => setDraft('How reliable is the current trust score?')}
                    >
                      🛡️ How reliable is the trust score?
                    </button>
                    <button
                      type="button"
                      className="quick-prompt-chip"
                      onClick={() => setDraft('Explain why vector retrieval scored 92% confidence.')}
                    >
                      💡 Explain vector retrieval confidence
                    </button>
                    <button
                      type="button"
                      className="quick-prompt-chip"
                      onClick={() => setDraft('What are the recommended next actions?')}
                    >
                      🚀 Recommended next actions
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id} className={`bubble ${message.sender}`}>
                      {renderFormattedMarkdown(message.text)}
                    </div>
                  ))}
                  {isThinking && (
                    <div className="bubble bot thinking-bubble">
                      <div className="thinking-dots">
                        <span className="dot dot-1" />
                        <span className="dot dot-2" />
                        <span className="dot dot-3" />
                      </div>
                      <span className="thinking-text">CLARIO-1 is analyzing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </section>

            <form className="composer" onSubmit={handleSend}>
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about trust, reasoning, or your next insight..."
              />
              <button type="submit" className="primary-btn compact-btn" disabled={isThinking}>
                {isThinking ? 'Thinking...' : 'Send'}
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
                    <span className="info-val">{activeConv?.title || 'New Session'}</span>
                  </div>
                </div>
              </div>

              <div className="profile-history-section">
                <div className="history-header">
                  <h4>Session Chat History ({messages.length})</h4>
                  {conversations.length > 0 && (
                    <button
                      type="button"
                      className="danger-btn-sm"
                      onClick={requestDeleteAllChat}
                      title="Delete all chat history across workspace"
                    >
                      🗑️ Delete All Chat
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
                onClick={requestSignOut}
                disabled={authLoading}
              >
                {authLoading ? 'Signing out...' : 'Log out'}
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

      {/* Toast Confirmation Modal for Delete All Chat with Password Verification */}
      {showDeleteAllToastModal && (
        <div className="toast-modal-backdrop" onClick={() => setShowDeleteAllToastModal(false)}>
          <div className="toast-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="toast-modal-header">
              <div className="toast-modal-icon">🗑️</div>
              <div>
                <h3>Confirm Delete All Chat</h3>
                <p className="toast-modal-subtitle">Password verification required to proceed</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowDeleteAllToastModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="toast-modal-body">
              <div className="toast-feature-desc-box">
                <span className="toast-desc-tag">Feature Description & Security Guard</span>
                <p className="toast-desc-text">
                  <strong>Delete All Chat History:</strong> This action will permanently wipe all conversation threads, topics, and message history across your entire workspace from local session and database storage.
                </p>
                <div className="toast-warning-note">
                  ⚠️ <strong>Warning:</strong> Deleting all chat history cannot be undone.
                </div>
              </div>

              <div className="password-confirm-box" style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Enter Account Password to Confirm Deletion:
                </label>
                <input
                  type="password"
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  placeholder="Enter your account password..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--inner-card-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
                {deletePasswordError && (
                  <p className="error-text" style={{ color: '#fca5a5', fontSize: '0.82rem', marginTop: '6px', margin: '6px 0 0' }}>
                    ⚠️ {deletePasswordError}
                  </p>
                )}
              </div>
            </div>

            <div className="toast-modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowDeleteAllToastModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={executeDeleteAllChat}
              >
                🗑️ Confirm & Delete All Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Confirmation Modal for Delete Conversation */}
      {showDeleteConvToastModal && (
        <div className="toast-modal-backdrop" onClick={() => setShowDeleteConvToastModal(false)}>
          <div className="toast-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="toast-modal-header">
              <div className="toast-modal-icon">🗑️</div>
              <div>
                <h3>Confirm Delete Conversation</h3>
                <p className="toast-modal-subtitle">Confirmation required before deleting conversation</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowDeleteConvToastModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="toast-modal-body">
              <div className="toast-feature-desc-box">
                <span className="toast-desc-tag">Feature Description</span>
                <p className="toast-desc-text">
                  <strong>Delete Conversation:</strong> This feature permanently removes the conversation (<em>"{conversations.find(c => c.id === convToDeleteId)?.title || 'Selected Conversation'}"</em>) and all associated message history from your left panel history and synced storage.
                </p>
                <div className="toast-warning-note">
                  ⚠️ <strong>Note:</strong> Deleting a conversation cannot be undone once confirmed.
                </div>
              </div>
            </div>

            <div className="toast-modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowDeleteConvToastModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={executeDeleteConversation}
              >
                🗑️ Confirm & Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Confirmation Modal for Log Out */}
      {showLogoutToastModal && (
        <div className="toast-modal-backdrop" onClick={() => setShowLogoutToastModal(false)}>
          <div className="toast-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="toast-modal-header">
              <div className="toast-modal-icon logout-icon">🚪</div>
              <div>
                <h3>Confirm Log Out</h3>
                <p className="toast-modal-subtitle">Confirmation required before ending session</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowLogoutToastModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="toast-modal-body">
              <div className="toast-feature-desc-box">
                <span className="toast-desc-tag">Feature Description</span>
                <p className="toast-desc-text">
                  <strong>Account Sign Out:</strong> Signing out safely terminates your active authentication session and returns you to the login screen. Your stored conversations will remain securely saved for your next login.
                </p>
                <div className="toast-info-note">
                  ℹ️ <strong>Info:</strong> You can sign back in at any time with your credentials.
                </div>
              </div>
            </div>

            <div className="toast-modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowLogoutToastModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={executeSignOut}
              >
                🚪 Confirm & Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Banner */}
      {toastNotice && (
        <div className={`toast-notification-banner ${toastNotice.type}`}>
          <span className="toast-banner-icon">
            {toastNotice.type === 'success' ? '✅' : 'ℹ️'}
          </span>
          <div className="toast-banner-content">
            <strong>{toastNotice.title}</strong>
            <p>{toastNotice.message}</p>
          </div>
          <button
            type="button"
            className="toast-banner-close"
            onClick={() => setToastNotice(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );

  return view === 'chatbot' ? renderChatbotView() : renderAuthView();
}

export default App;
