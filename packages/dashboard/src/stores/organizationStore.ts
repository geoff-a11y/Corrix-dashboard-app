import { create } from 'zustand';

interface OrganizationState {
  organizationId: string | null;
  organizationName: string | null;
  setOrganization: (id: string, name: string) => void;
  clearOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizationId: 'demo-org', // Default for development
  organizationName: 'Demo Organization',
  setOrganization: (id, name) => set({ organizationId: id, organizationName: name }),
  clearOrganization: () => set({ organizationId: null, organizationName: null }),
}));
