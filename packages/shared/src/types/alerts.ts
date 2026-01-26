export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'score' | 'engagement' | 'coaching' | 'team';
  title: string;
  description: string;
  metric?: { name: string; value: number; change: number };
  recommendation: string;
  entityType: 'organization' | 'team' | 'user';
  entityId: string;
  entityName: string;
  createdAt: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  summary: { critical: number; warning: number; info: number };
}

export interface Recommendation {
  id: string;
  priority: number;
  title: string;
  description: string;
  actionUrl?: string;
  entityType: 'organization' | 'team' | 'user';
  entityId: string;
}
