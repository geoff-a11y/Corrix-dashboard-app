// Organization (enterprise customer)
export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  settings: Record<string, unknown>;
}

// Team within organization
export interface Team {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  createdAt: string;
}

// User (anonymized - no PII stored)
export interface User {
  id: string;
  organizationId: string;
  teamId: string | null;
  anonymousId: string;  // Hashed identifier from extension
  firstSeenAt: string;
  lastSeenAt: string;
  metadata: {
    role?: string;
    department?: string;
  };
}
