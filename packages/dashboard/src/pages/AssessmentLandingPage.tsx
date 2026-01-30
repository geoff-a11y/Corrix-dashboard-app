import { Link } from 'react-router-dom';

export default function AssessmentLandingPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
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
