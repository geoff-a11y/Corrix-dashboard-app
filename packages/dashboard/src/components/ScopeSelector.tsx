import { useCallback } from 'react';
import { useScope } from '@/contexts/ScopeContext';
import { clsx } from 'clsx';
import { Spinner } from './loading';

interface ScopeSelectorProps {
  className?: string;
}

export function ScopeSelector({ className }: ScopeSelectorProps) {
  const { scope, setScope, organizations, teams, users, loadingOrgs, loadingTeams, loadingUsers } = useScope();

  const handleOrgChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (selectedValue === 'all') {
      setScope({ level: 'all' });
    } else {
      const org = organizations.find(o => o.id === selectedValue);
      setScope({
        level: 'organization',
        organizationId: selectedValue,
        organizationName: org?.name,
      });
    }
  }, [organizations, setScope]);

  const handleTeamChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (selectedValue === 'all') {
      setScope({
        level: 'organization',
        organizationId: scope.organizationId,
        organizationName: scope.organizationName,
      });
    } else {
      const team = teams.find(t => t.id === selectedValue);
      setScope({
        level: 'team',
        organizationId: scope.organizationId,
        organizationName: scope.organizationName,
        teamId: selectedValue,
        teamName: team?.name,
      });
    }
  }, [teams, scope.organizationId, scope.organizationName, setScope]);

  const handleUserChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (selectedValue === 'all') {
      // Clear user selection while preserving org/team
      setScope({
        ...scope,
        userId: undefined,
        userDisplayId: undefined,
      });
    } else {
      const user = users.find(u => u.id === selectedValue);
      setScope({
        ...scope,
        userId: selectedValue,
        userDisplayId: user?.displayId,
      });
    }
  }, [users, scope, setScope]);

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {/* Organization selector */}
      <div className="relative">
        <select
          value={scope.level === 'all' ? 'all' : scope.organizationId}
          onChange={handleOrgChange}
          disabled={loadingOrgs}
          className="bg-bg-tertiary border border-border-default rounded-lg pl-3 pr-8 py-1.5 text-sm text-text-primary appearance-none cursor-pointer hover:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
        >
          <option value="all">All Organizations</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
          {loadingOrgs ? (
            <Spinner size="sm" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Team selector - only visible when org is selected */}
      {scope.organizationId && (
        <>
          <span className="text-text-muted">/</span>
          <div className="relative">
            <select
              value={scope.level === 'team' ? scope.teamId : 'all'}
              onChange={handleTeamChange}
              disabled={loadingTeams}
              className="bg-bg-tertiary border border-border-default rounded-lg pl-3 pr-8 py-1.5 text-sm text-text-primary appearance-none cursor-pointer hover:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
            >
              <option value="all">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
              {loadingTeams ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>

          {/* User selector - only visible when org is selected */}
          <>
            <span className="text-text-muted">/</span>
            <div className="relative">
              <select
                value={scope.userId || 'all'}
                onChange={handleUserChange}
                disabled={loadingUsers}
                className="bg-bg-tertiary border border-border-default rounded-lg pl-3 pr-8 py-1.5 text-sm text-text-primary appearance-none cursor-pointer hover:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
              >
                <option value="all">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.displayId}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                {loadingUsers ? (
                  <Spinner size="sm" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </div>
          </>
        </>
      )}
    </div>
  );
}
