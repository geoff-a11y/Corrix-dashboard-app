import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Industry options
const INDUSTRIES = [
  { id: 'tech', name: 'Technology & software', icon: '💻' },
  { id: 'professional', name: 'Professional services', icon: '💼' },
  { id: 'marketing', name: 'Marketing & creative', icon: '🎨' },
  { id: 'healthcare', name: 'Healthcare & life sciences', icon: '🏥' },
  { id: 'finance', name: 'Finance & banking', icon: '📊' },
  { id: 'education', name: 'Education & nonprofit', icon: '📚' },
  { id: 'other', name: 'Other industry', icon: '🏢' },
];

// Role options
const ROLES = [
  { id: 'ic', name: 'Individual contributor', description: 'You focus on your own work and projects' },
  { id: 'manager', name: 'Manager or team lead', description: 'You manage people or lead a team' },
  { id: 'director', name: 'Director or senior leader', description: 'You oversee multiple teams or functions' },
  { id: 'executive', name: 'Executive or founder', description: 'You set strategy for the organization' },
];

// Scenario categories - updated with clearer descriptions
const SCENARIO_CATEGORIES = [
  {
    id: 'professional-communication',
    name: 'Writing & communication',
    description: 'Drafting emails, reports, summaries, and workplace documents',
    example: 'Like asking AI to help write a tricky email or summarize meeting notes',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    variants: [
      { id: 'email-difficult-client', name: 'Responding to a difficult message', context: 'handling a frustrated client or colleague' },
      { id: 'status-report', name: 'Writing a status update', context: 'summarizing progress for stakeholders' },
      { id: 'meeting-summary', name: 'Documenting a meeting', context: 'capturing decisions and action items' },
      { id: 'proposal-feedback', name: 'Requesting feedback', context: 'asking colleagues for input on your work' },
    ]
  },
  {
    id: 'creative-content',
    name: 'Content & marketing',
    description: 'Creating campaigns, articles, newsletters, and brand content',
    example: 'Like brainstorming social posts or outlining a blog article',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    variants: [
      { id: 'social-campaign', name: 'Planning social media content', context: 'promoting a product, service, or announcement' },
      { id: 'blog-outline', name: 'Outlining an article', context: 'structuring a thought leadership piece' },
      { id: 'tagline-brainstorm', name: 'Brainstorming messaging', context: 'developing taglines or positioning' },
      { id: 'newsletter-draft', name: 'Drafting a newsletter', context: 'writing an update for your audience' },
    ]
  },
  {
    id: 'problem-solving',
    name: 'Analysis & problem solving',
    description: 'Working through decisions, investigating issues, and planning solutions',
    example: 'Like analyzing options, troubleshooting problems, or assessing risks',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    variants: [
      { id: 'process-improvement', name: 'Improving a process', context: 'fixing workflow bottlenecks' },
      { id: 'decision-matrix', name: 'Comparing options', context: 'evaluating vendors, tools, or approaches' },
      { id: 'root-cause', name: 'Investigating a problem', context: 'finding why something keeps going wrong' },
      { id: 'risk-assessment', name: 'Assessing risks', context: 'planning for what could go wrong' },
    ]
  },
  {
    id: 'learning-research',
    name: 'Research & learning',
    description: 'Understanding new topics, researching competitors, and getting up to speed',
    example: 'Like learning about a new trend or researching a competitor',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    variants: [
      { id: 'tech-explainer', name: 'Understanding a new topic', context: 'learning about trends, technologies, or concepts' },
      { id: 'competitive-analysis', name: 'Researching competitors', context: 'understanding what others are doing' },
      { id: 'best-practices', name: 'Finding best practices', context: 'learning how others approach a challenge' },
      { id: 'concept-summary', name: 'Getting up to speed quickly', context: 'preparing for a meeting or conversation' },
    ]
  },
  {
    id: 'planning-strategy',
    name: 'Planning & strategy',
    description: 'Setting goals, planning projects, and allocating resources',
    example: 'Like planning a project kickoff or setting quarterly priorities',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    variants: [
      { id: 'project-kickoff', name: 'Planning a project kickoff', context: 'launching a new initiative' },
      { id: 'quarterly-goals', name: 'Setting goals', context: 'defining objectives and success metrics' },
      { id: 'resource-allocation', name: 'Allocating resources', context: 'deciding how to use limited time or people' },
      { id: 'timeline-draft', name: 'Creating a timeline', context: 'mapping out milestones and deadlines' },
    ]
  },
  {
    id: 'code-technical',
    name: 'Technical work',
    description: 'Code reviews, debugging, system design, and technical documentation',
    example: 'Like reviewing code, debugging issues, or documenting systems',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    isTechnical: true,
    variants: [
      { id: 'code-review', name: 'Reviewing code', context: 'giving feedback on someone\'s work' },
      { id: 'debug-session', name: 'Debugging an issue', context: 'troubleshooting a tricky problem' },
      { id: 'api-design', name: 'Designing a system', context: 'planning how something should work' },
      { id: 'tech-doc', name: 'Writing documentation', context: 'explaining a system for others' },
    ]
  },
];

interface MessageCard {
  id: string;
  content: string;
  isComplete: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  cards?: MessageCard[];
  timestamp: Date;
}

interface SessionState {
  sessionId: string | null;
  scenarioId: string | null;
  messages: Message[];
  currentState: string;
  isComplete: boolean;
}

type SelectionStep = 'industry' | 'role' | 'category' | 'variant';

export default function LiveChatAssessmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'chat' | 'complete'>('select');
  const [selectionStep, setSelectionStep] = useState<SelectionStep>('industry');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [session, setSession] = useState<SessionState>({
    sessionId: null,
    scenarioId: null,
    messages: [],
    currentState: 'opening',
    isComplete: false,
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const parseIntoCards = (text: string): MessageCard[] => {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const cards: MessageCard[] = [];
    let currentCard = '';
    let cardId = 0;

    for (const sentence of sentences) {
      currentCard += (currentCard ? ' ' : '') + sentence;
      if (currentCard.length > 80 || sentences.indexOf(sentence) === sentences.length - 1) {
        cards.push({
          id: `card-${cardId++}`,
          content: currentCard.trim(),
          isComplete: true,
        });
        currentCard = '';
      }
    }

    return cards;
  };

  // Get device context for analytics
  const getDeviceContext = () => {
    const width = window.innerWidth;
    let screenCategory = 'desktop';
    if (width < 640) screenCategory = 'mobile';
    else if (width < 1024) screenCategory = 'tablet';

    return {
      screenCategory,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referralSource: document.referrer || null,
    };
  };

  const startSession = async () => {
    if (!selectedVariant) return;

    setIsLoading(true);
    setError(null);

    const deviceContext = getDeviceContext();

    try {
      const response = await fetch(`${API_URL}/live-chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedVariant,
          industry: selectedIndustry,
          role: selectedRole,
          // Device context
          screenCategory: deviceContext.screenCategory,
          timezone: deviceContext.timezone,
          referralSource: deviceContext.referralSource,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      const openingCards = parseIntoCards(data.openingMessage);

      setSession({
        sessionId: data.sessionId,
        scenarioId: selectedVariant,
        messages: [{
          id: '0',
          role: 'assistant',
          content: data.openingMessage,
          cards: openingCards,
          timestamp: new Date(),
        }],
        currentState: 'opening',
        isComplete: false,
      });

      setStep('chat');
    } catch (err) {
      setError('Failed to start assessment. Please try again.');
      console.error('Start session error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !session.sessionId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const assistantMessageId = (Date.now() + 1).toString();

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/live-chat/message/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';

      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          cards: [],
          timestamp: new Date(),
        }],
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'chunk') {
                fullContent += data.content;

                setSession(prev => {
                  const messages = [...prev.messages];
                  const lastMsg = messages[messages.length - 1];
                  if (lastMsg.role === 'assistant') {
                    lastMsg.cards = [{
                      id: 'streaming',
                      content: fullContent,
                      isComplete: false,
                    }];
                    lastMsg.content = fullContent;
                  }
                  return { ...prev, messages };
                });

              } else if (data.type === 'done') {
                const finalCards = parseIntoCards(fullContent);

                setSession(prev => {
                  const messages = [...prev.messages];
                  const lastMsg = messages[messages.length - 1];
                  if (lastMsg.role === 'assistant') {
                    lastMsg.cards = finalCards;
                    lastMsg.content = fullContent;
                  }
                  return {
                    ...prev,
                    messages,
                    currentState: data.state,
                    isComplete: data.isComplete,
                  };
                });

                if (data.isComplete) {
                  setTimeout(() => {
                    navigate(`/verify/${data.credentialId}`);
                  }, 2000);
                }
              }
            } catch (parseErr) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Send message error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getVariantDetails = (variantId: string) => {
    for (const category of SCENARIO_CATEGORIES) {
      const variant = category.variants.find(v => v.id === variantId);
      if (variant) {
        return { category, variant };
      }
    }
    return null;
  };

  const goBack = () => {
    if (selectionStep === 'role') {
      setSelectionStep('industry');
      setSelectedRole(null);
    } else if (selectionStep === 'category') {
      setSelectionStep('role');
      setSelectedCategory(null);
    } else if (selectionStep === 'variant') {
      setSelectionStep('category');
      setSelectedVariant(null);
    }
  };

  const renderScenarioSelection = () => (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src="/images/logo.png" alt="Corrix" className="h-8" />
          <button
            onClick={() => navigate('/assessment')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Back to options
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['industry', 'role', 'category', 'variant'].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                selectionStep === s ? 'bg-[#7877DF] text-white' :
                ['industry', 'role', 'category', 'variant'].indexOf(selectionStep) > idx ? 'bg-[#7877DF]/30 text-[#7877DF]' :
                'bg-gray-800 text-gray-500'
              }`}>
                {idx + 1}
              </div>
              {idx < 3 && <div className={`w-8 h-0.5 ${
                ['industry', 'role', 'category', 'variant'].indexOf(selectionStep) > idx ? 'bg-[#7877DF]/30' : 'bg-gray-800'
              }`} />}
            </div>
          ))}
        </div>

        {/* Industry Selection */}
        {selectionStep === 'industry' && (
          <>
            <div className="text-center mb-10">
              <h1 className="font-['Young_Serif'] text-3xl mb-3">
                What industry do you work in?
              </h1>
              <p className="text-gray-400 max-w-xl mx-auto">
                We'll tailor the assessment to reflect scenarios you'd actually encounter in your work with AI.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {INDUSTRIES.map((industry) => (
                <button
                  key={industry.id}
                  onClick={() => {
                    setSelectedIndustry(industry.id);
                    setSelectionStep('role');
                  }}
                  className="bg-[#242424] border border-gray-700 rounded-xl p-5 text-left hover:border-[#7877DF] transition-colors group"
                >
                  <span className="text-2xl mb-3 block">{industry.icon}</span>
                  <h3 className="font-medium group-hover:text-[#7877DF] transition-colors">
                    {industry.name}
                  </h3>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Role Selection */}
        {selectionStep === 'role' && (
          <>
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="text-center mb-10">
              <h1 className="font-['Young_Serif'] text-3xl mb-3">
                What's your role?
              </h1>
              <p className="text-gray-400 max-w-xl mx-auto">
                This helps us match you with scenarios at the right level of responsibility.
              </p>
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    setSelectedRole(role.id);
                    setSelectionStep('category');
                  }}
                  className="w-full bg-[#242424] border border-gray-700 rounded-xl p-5 text-left hover:border-[#7877DF] transition-colors group"
                >
                  <h3 className="font-medium mb-1 group-hover:text-[#7877DF] transition-colors">
                    {role.name}
                  </h3>
                  <p className="text-gray-500 text-sm">{role.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Category Selection */}
        {selectionStep === 'category' && (
          <>
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="text-center mb-10">
              <h1 className="font-['Young_Serif'] text-3xl mb-3">
                What type of work do you do with AI?
              </h1>
              <p className="text-gray-400 max-w-xl mx-auto">
                Choose the category that best matches how you collaborate with AI day-to-day. This helps us understand your natural collaboration style.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {SCENARIO_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectionStep('variant');
                  }}
                  className="bg-[#242424] border border-gray-700 rounded-xl p-6 text-left hover:border-[#7877DF] transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#7877DF]/20 flex items-center justify-center text-[#7877DF] flex-shrink-0 group-hover:bg-[#7877DF]/30 transition-colors">
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-['Young_Serif'] text-lg mb-1 group-hover:text-[#7877DF] transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-gray-500 text-sm mb-2">
                        {category.description}
                      </p>
                      <p className="text-gray-600 text-xs italic">
                        {category.example}
                      </p>
                    </div>
                  </div>
                  {category.isTechnical && (
                    <div className="mt-3 text-xs text-gray-600 bg-gray-800/50 rounded px-2 py-1 inline-block">
                      Best for technical roles
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Variant Selection */}
        {selectionStep === 'variant' && (
          <>
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {(() => {
              const category = SCENARIO_CATEGORIES.find(c => c.id === selectedCategory);
              if (!category) return null;

              return (
                <>
                  <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-full bg-[#7877DF]/20 flex items-center justify-center text-[#7877DF] mx-auto mb-4">
                      {category.icon}
                    </div>
                    <h1 className="font-['Young_Serif'] text-3xl mb-3">
                      {category.name}
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                      Pick the specific scenario that's closest to work you actually do. The more realistic it feels, the better we can assess your collaboration style.
                    </p>
                  </div>

                  <div className="space-y-3 max-w-2xl mx-auto">
                    {category.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`w-full bg-[#242424] border rounded-xl p-5 text-left transition-colors ${
                          selectedVariant === variant.id
                            ? 'border-[#7877DF] bg-[#7877DF]/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium mb-1">{variant.name}</h4>
                            <p className="text-gray-500 text-sm">{variant.context}</p>
                          </div>
                          {selectedVariant === variant.id && (
                            <div className="w-6 h-6 rounded-full bg-[#7877DF] flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedVariant && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={startSession}
                        disabled={isLoading}
                        className="bg-[#7877DF] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#6665c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Starting...' : 'Begin assessment'}
                      </button>
                      <p className="text-gray-500 text-sm mt-3">
                        About 15-20 minutes • Your responses are analyzed to understand your collaboration style
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {error && (
          <div className="mt-6 bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}
      </main>
    </div>
  );

  const renderChatInterface = () => {
    const variantDetails = selectedVariant ? getVariantDetails(selectedVariant) : null;

    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
        <header className="bg-black border-b border-gray-800 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/images/logo.png" alt="Corrix" className="h-8" />
              {variantDetails && (
                <div className="border-l border-gray-700 pl-4">
                  <p className="text-sm text-gray-400">{variantDetails.category.name}</p>
                  <p className="text-sm font-medium">{variantDetails.variant.name}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${session.isComplete ? 'bg-green-500' : 'bg-[#7877DF] animate-pulse'}`} />
              {session.isComplete ? 'Complete' : 'In progress'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
            {session.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'user' ? (
                  <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-[#7877DF] text-white">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                ) : (
                  <div className="max-w-[80%] space-y-3">
                    {message.cards && message.cards.length > 0 ? (
                      message.cards.map((card, idx) => (
                        <div
                          key={card.id}
                          className="rounded-2xl px-5 py-3 bg-[#242424] border border-gray-700 animate-fade-in-up"
                          style={{
                            animationDelay: `${idx * 150}ms`,
                            animationFillMode: 'both',
                          }}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{card.content}</p>
                          {!card.isComplete && (
                            <span className="inline-block w-2 h-4 bg-[#7877DF] animate-pulse ml-1 rounded-sm" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl px-5 py-3 bg-[#242424] border border-gray-700">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && !session.messages.some(m => m.role === 'assistant' && m.cards?.some(c => !c.isComplete)) && (
              <div className="flex justify-start">
                <div className="bg-[#242424] border border-gray-700 rounded-2xl px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {session.isComplete && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 bg-green-900/20 border border-green-800 rounded-lg px-4 py-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Assessment complete! Generating your credential...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {!session.isComplete && (
          <div className="border-t border-gray-800 flex-shrink-0">
            <div className="max-w-3xl mx-auto px-6 py-4">
              {error && (
                <div className="mb-3 text-red-400 text-sm">{error}</div>
              )}
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 bg-[#242424] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#7877DF] transition-colors"
                  style={{ minHeight: '48px', maxHeight: '150px' }}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-[#7877DF] text-white px-4 py-3 rounded-xl hover:bg-[#6665c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 text-xs mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (step === 'select') {
    return renderScenarioSelection();
  }

  return renderChatInterface();
}
