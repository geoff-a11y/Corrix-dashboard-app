import { Link } from 'react-router-dom';

export default function AssessmentLandingPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <img src="/images/logo.png" alt="Corrix" className="h-8" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-['Young_Serif'] text-4xl mb-4">
            Get Your AI Collaboration Assessment
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover how effectively you collaborate with AI. Choose the assessment format that works best for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Quick Assessment Card */}
          <Link
            to="/quick-assessment"
            className="block bg-[#242424] border border-gray-700 rounded-xl p-8 hover:border-[#7877DF] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#7877DF]/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#7877DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm text-gray-500 bg-gray-800 px-2 py-1 rounded">~2 minutes</span>
            </div>

            <h2 className="font-['Young_Serif'] text-2xl mb-3 group-hover:text-[#7877DF] transition-colors">
              Quick Assessment
            </h2>

            <p className="text-gray-400 mb-4">
              Paste your AI chat history and receive an instant analysis of your collaboration patterns.
            </p>

            <ul className="text-sm text-gray-500 space-y-2">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Based on your existing conversations
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Works with ChatGPT, Claude, or Gemini
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Get results immediately
              </li>
            </ul>

            <div className="mt-6 text-[#7877DF] font-medium flex items-center gap-2">
              Start Quick Assessment
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Live Chat Assessment Card */}
          <Link
            to="/live-chat-assessment"
            className="block bg-[#242424] border border-gray-700 rounded-xl p-8 hover:border-[#7877DF] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#7877DF]/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#7877DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-sm text-gray-500 bg-gray-800 px-2 py-1 rounded">~20 minutes</span>
            </div>

            <h2 className="font-['Young_Serif'] text-2xl mb-3 group-hover:text-[#7877DF] transition-colors">
              Live Chat Assessment
            </h2>

            <p className="text-gray-400 mb-4">
              Work through a realistic scenario with Corrix and get a deeper analysis of your collaboration style.
            </p>

            <ul className="text-sm text-gray-500 space-y-2">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Choose a scenario matching your work
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Real-time collaboration experience
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                More detailed behavioral insights
              </li>
            </ul>

            <div className="mt-6 text-[#7877DF] font-medium flex items-center gap-2">
              Start Live Assessment
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Comparison Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Both assessments generate the same Corrix credential. Choose based on your available time and preference.
          </p>
        </div>

        {/* Privacy Assurance */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-[#242424] border border-gray-700 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Your privacy is protected</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your conversations are analyzed by your own AI tool and never sent to or stored by Corrix.
                  Your credential is yours to share with employers or anyone you choose — we never sell your personal data.
                </p>
                <a
                  href="https://corrix.ai/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#7877DF] text-sm mt-3 hover:underline"
                >
                  Read our Privacy Policy
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-4 text-center text-gray-500 text-sm">
          © Human Machines Group LLC 2026
        </div>
      </footer>
    </div>
  );
}
