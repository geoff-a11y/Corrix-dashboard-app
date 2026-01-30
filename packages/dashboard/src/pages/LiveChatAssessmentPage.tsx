import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Scenario categories and variants
const SCENARIO_CATEGORIES = [
  {
    id: 'professional-communication',
    name: 'Professional communication',
    description: 'Emails, reports, and workplace documents',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    variants: [
      { id: 'email-difficult-client', name: 'Email to a difficult client', context: 'responding to a frustrated customer' },
      { id: 'status-report', name: 'Weekly status report', context: 'summarizing project progress' },
      { id: 'meeting-summary', name: 'Meeting summary', context: 'documenting key decisions' },
      { id: 'proposal-feedback', name: 'Proposal feedback request', context: 'asking for input on a draft' },
    ]
  },
  {
    id: 'creative-content',
    name: 'Creative content',
    description: 'Marketing, social media, and storytelling',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    variants: [
      { id: 'social-campaign', name: 'Social media campaign', context: 'launching a new product' },
      { id: 'blog-outline', name: 'Blog post outline', context: 'thought leadership piece' },
      { id: 'tagline-brainstorm', name: 'Tagline brainstorming', context: 'rebranding initiative' },
      { id: 'newsletter-draft', name: 'Newsletter draft', context: 'monthly company update' },
    ]
  },
  {
    id: 'problem-solving',
    name: 'Problem solving',
    description: 'Analysis, troubleshooting, and decision-making',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    variants: [
      { id: 'process-improvement', name: 'Process improvement', context: 'identifying workflow bottlenecks' },
      { id: 'decision-matrix', name: 'Decision matrix', context: 'evaluating vendor options' },
      { id: 'root-cause', name: 'Root cause analysis', context: 'investigating a recurring issue' },
      { id: 'risk-assessment', name: 'Risk assessment', context: 'new project planning' },
    ]
  },
  {
    id: 'learning-research',
    name: 'Learning & research',
    description: 'Understanding new topics and gathering information',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    variants: [
      { id: 'tech-explainer', name: 'Technology explainer', context: 'understanding AI concepts' },
      { id: 'competitive-analysis', name: 'Competitive analysis', context: 'market research' },
      { id: 'best-practices', name: 'Best practices research', context: 'industry standards' },
      { id: 'concept-summary', name: 'Concept summary', context: 'learning a new skill' },
    ]
  },
  {
    id: 'planning-strategy',
    name: 'Planning & strategy',
    description: 'Projects, goals, and roadmaps',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    variants: [
      { id: 'project-kickoff', name: 'Project kickoff plan', context: 'new initiative launch' },
      { id: 'quarterly-goals', name: 'Quarterly goal setting', context: 'OKR planning' },
      { id: 'resource-allocation', name: 'Resource allocation', context: 'team capacity planning' },
      { id: 'timeline-draft', name: 'Timeline drafting', context: 'milestone planning' },
    ]
  },
  {
    id: 'code-technical',
    name: 'Code & technical',
    description: 'Programming, debugging, and technical documentation',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    variants: [
      { id: 'code-review', name: 'Code review', context: 'reviewing a pull request' },
      { id: 'debug-session', name: 'Debug session', context: 'fixing a tricky bug' },
      { id: 'api-design', name: 'API design', context: 'planning new endpoints' },
      { id: 'tech-doc', name: 'Technical documentation', context: 'writing developer docs' },
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
  cards?: MessageCard[]; // For assistant messages, split into cards
  timestamp: Date;
}

interface SessionState {
  sessionId: string | null;
  scenarioId: string | null;
  messages: Message[];
  currentState: string;
  isComplete: boolean;
}

export default function LiveChatAssessmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'chat' | 'complete'>('select');
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  // Parse text into cards (by sentence groups)
  const parseIntoCards = (text: string): MessageCard[] => {
    // Split by sentence-ending punctuation followed by space
    const sentences = text.split(/(?<=[.!?])\s+/);
    const cards: MessageCard[] = [];
    let currentCard = '';
    let cardId = 0;

    for (const sentence of sentences) {
      currentCard += (currentCard ? ' ' : '') + sentence;
      // Create a new card every 1-2 sentences or if content is long enough
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

  // Start a new session
  const startSession = async () => {
    if (!selectedVariant) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/live-chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selectedVariant }),
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();

      // Parse opening message into cards
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

  // Send a message with streaming
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

      // Add initial assistant message with empty cards
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

                // Show single streaming card while typing
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
                // Parse into multiple cards when complete
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
              // Ignore parse errors for partial chunks
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

  // Handle key press in textarea
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Get category by variant ID
  const getVariantDetails = (variantId: string) => {
    for (const category of SCENARIO_CATEGORIES) {
      const variant = category.variants.find(v => v.id === variantId);
      if (variant) {
        return { category, variant };
      }
    }
    return null;
  };

  // Render scenario selection
  const renderScenarioSelection = () => (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-['Young_Serif'] text-3xl mb-3">
            Choose your scenario
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Select a scenario that reflects the type of work you typically do with AI. This helps us understand your collaboration style in a realistic context.
          </p>
        </div>

        {/* Category Selection */}
        {!selectedCategory ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCENARIO_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="bg-[#242424] border border-gray-700 rounded-xl p-6 text-left hover:border-[#7877DF] transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-[#7877DF]/20 flex items-center justify-center mb-4 text-[#7877DF] group-hover:bg-[#7877DF]/30 transition-colors">
                  {category.icon}
                </div>
                <h3 className="font-['Young_Serif'] text-lg mb-2 group-hover:text-[#7877DF] transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-500 text-sm">
                  {category.description}
                </p>
              </button>
            ))}
          </div>
        ) : (
          /* Variant Selection */
          <div>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedVariant(null);
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to categories
            </button>

            {(() => {
              const category = SCENARIO_CATEGORIES.find(c => c.id === selectedCategory);
              if (!category) return null;

              return (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#7877DF]/20 flex items-center justify-center text-[#7877DF]">
                      {category.icon}
                    </div>
                    <div>
                      <h2 className="font-['Young_Serif'] text-xl">{category.name}</h2>
                      <p className="text-gray-500 text-sm">{category.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
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
                            <p className="text-gray-500 text-sm">Context: {variant.context}</p>
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
                        This assessment takes approximately 20 minutes
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}
      </main>
    </div>
  );

  // Render chat interface
  const renderChatInterface = () => {
    const variantDetails = selectedVariant ? getVariantDetails(selectedVariant) : null;

    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
        {/* Header */}
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
              {session.isComplete ? 'Complete' : 'In Progress'}
            </div>
          </div>
        </header>

        {/* Messages */}
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

            {isLoading && (
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

        {/* Input Area */}
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

  // Render based on current step
  if (step === 'select') {
    return renderScenarioSelection();
  }

  return renderChatInterface();
}
