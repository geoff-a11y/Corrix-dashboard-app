import { api } from './client';
import type { Credential, CredentialGenerateResponse, CredentialVerifyResponse } from '../types/credential';

/**
 * Generate a new credential from AI assessment output
 */
export async function generateCredential(params: {
  email: string;
  encodedData: string;
  holderName?: string;
}): Promise<CredentialGenerateResponse> {
  return api.post<CredentialGenerateResponse>('/credential/generate', params);
}

/**
 * Verify a credential by its credential ID (public)
 */
export async function verifyCredential(credentialId: string): Promise<CredentialVerifyResponse> {
  return api.get<CredentialVerifyResponse>(`/credential/verify/${credentialId}`);
}

/**
 * Get full credential data by ID (for PDF generation)
 */
export async function getCredential(id: string): Promise<Credential> {
  return api.get<Credential>(`/credential/${id}`);
}

/**
 * List recent credentials (admin)
 */
export async function listCredentials(): Promise<Credential[]> {
  return api.get<Credential[]>('/credential');
}
