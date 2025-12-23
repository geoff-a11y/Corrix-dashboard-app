import { Outlet, NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '@/auth/AuthContext';
import { ScopeSelector } from '@/components/ScopeSelector';
import { DateRangeSelector } from '@/components/DateRangeSelector';

type NavItem = { to: string; label: string; icon: string; indent?: boolean; end?: boolean };
type NavSection = { section: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    section: 'Core',
    items: [
      { to: '/overview', label: 'Overview', icon: '📊' },
      { to: '/teams', label: 'Teams', icon: '👥' },
      { to: '/adoption', label: 'Adoption', icon: '📈' },
    ],
  },
  {
    section: 'Behavioral Intelligence',
    items: [
      { to: '/behaviors', label: 'Behaviors', icon: '🎯', end: true },
      { to: '/behaviors/deep-dive', label: 'Deep Dive', icon: '🔬', indent: true },
      { to: '/temporal', label: 'Temporal Indicators', icon: '⏱️' },
    ],
  },
  {
    section: 'Development',
    items: [
      { to: '/skills', label: 'Skill Development', icon: '📚' },
      { to: '/benchmarks', label: 'Benchmarks', icon: '🏆' },
    ],
  },
  {
    section: 'Coaching',
    items: [
      { to: '/coaching', label: 'Coaching Insights', icon: '💡' },
    ],
  },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-primary border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <img
            src="/images/logo.png"
            alt="Corrix"
            className="h-8 w-auto"
          />
          <p className="text-xs text-text-muted mt-1">Admin Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {navSections.map((section, sectionIndex) => (
            <div key={section.section} className={clsx(sectionIndex > 0 && 'mt-6')}>
              <h3 className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                {section.section}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 py-2.5 rounded-lg transition-colors',
                          item.indent ? 'pl-8 pr-4' : 'px-4',
                          isActive
                            ? 'bg-accent text-white'
                            : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                        )
                      }
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center">
              <span className="text-text-muted text-sm">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{user?.email}</p>
              <p className="text-xs text-text-muted truncate">{user?.organizationName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full mt-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with scope and date selectors */}
        <header className="flex-shrink-0 h-14 bg-bg-primary border-b border-border flex items-center justify-between px-8">
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <span>Viewing:</span>
              <ScopeSelector />
            </div>
            <div className="flex items-center gap-2">
              <span>Period:</span>
              <DateRangeSelector />
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
