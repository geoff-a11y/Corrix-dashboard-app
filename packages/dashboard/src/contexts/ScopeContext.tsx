import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { teamsApi, type TeamListItem } from '@/api/teams';
import { organizationsApi, type OrganizationListItem } from '@/api/organizations';
import { usersApi, type UserListItem } from '@/api/users';
import { useAuth } from '@/auth/AuthContext';

export type ScopeLevel = 'all' | 'organization' | 'team';

export interface ScopeSelection {
  level: ScopeLevel;
  organizationId?: string;
  organizationName?: string;
  teamId?: string;
  teamName?: string;
  userId?: string;
  userDisplayId?: string;
}

interface ScopeContextValue {
  scope: ScopeSelection;
  setScope: (scope: ScopeSelection) => void;
  organizations: OrganizationListItem[];
  teams: TeamListItem[];
  users: UserListItem[];
  loadingOrgs: boolean;
  loadingTeams: boolean;
  loadingUsers: boolean;
}

const ScopeContext = createContext<ScopeContextValue | null>(null);

const STORAGE_KEY = 'corrix-scope';

export function ScopeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Initialize from user's organization (not localStorage to avoid stale org access)
  const [scope, setScopeState] = useState<ScopeSelection>(() => {
    // Always default to user's organization to prevent 403 errors
    return { level: 'all' };
  });

  // Set scope to user's organization when auth loads
  useEffect(() => {
    if (user?.organizationId) {
      setScopeState({
        level: 'organization',
        organizationId: user.organizationId,
        organizationName: user.organizationName,
      });
    }
  }, [user?.organizationId, user?.organizationName]);

  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Persist to localStorage
  const setScope = useCallback((newScope: ScopeSelection) => {
    setScopeState(newScope);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newScope));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Load organizations on mount - filter to user's org only to prevent 403 errors
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const data = await organizationsApi.listOrganizations();
        // Filter to only show the user's organization
        const filteredOrgs = user?.organizationId
          ? data.filter(org => org.id === user.organizationId)
          : data;
        setOrganizations(filteredOrgs);
      } catch (err) {
        console.error('Failed to load organizations:', err);
      } finally {
        setLoadingOrgs(false);
      }
    }

    if (user) {
      fetchOrganizations();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load teams when organization changes and validate stored team
  useEffect(() => {
    if (!scope.organizationId) {
      setTeams([]);
      return;
    }

    async function fetchTeams() {
      setLoadingTeams(true);
      try {
        const data = await teamsApi.listTeams(scope.organizationId!);
        setTeams(data);

        // Validate stored team still exists
        if (scope.teamId) {
          const teamExists = data.some(team => team.id === scope.teamId);
          if (!teamExists) {
            // Reset to organization-level if stored team no longer exists
            setScope({
              level: 'organization',
              organizationId: scope.organizationId,
              organizationName: scope.organizationName,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load teams:', err);
      } finally {
        setLoadingTeams(false);
      }
    }

    fetchTeams();
  }, [scope.organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load users when scope changes (team or organization)
  useEffect(() => {
    if (!scope.organizationId) {
      setUsers([]);
      return;
    }

    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const data = await usersApi.listUsers({
          organizationId: scope.organizationId,
          teamId: scope.teamId,
        });
        setUsers(data);

        // Validate stored user still exists
        if (scope.userId) {
          const userExists = data.some(user => user.id === scope.userId);
          if (!userExists) {
            // Clear user selection if user no longer in scope
            setScope({
              ...scope,
              userId: undefined,
              userDisplayId: undefined,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchUsers();
  }, [scope.organizationId, scope.teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ScopeContext.Provider value={{ scope, setScope, organizations, teams, users, loadingOrgs, loadingTeams, loadingUsers }}>
      {children}
    </ScopeContext.Provider>
  );
}

export function useScope() {
  const context = useContext(ScopeContext);
  if (!context) {
    throw new Error('useScope must be used within a ScopeProvider');
  }
  return context;
}
