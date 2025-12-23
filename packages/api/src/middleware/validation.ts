import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const signalSchema = z.object({
  sessionId: z.string(),
  timestamp: z.string(),
  platform: z.enum(['claude', 'chatgpt', 'gemini']),

  // Prompt analysis
  promptHasContext: z.boolean().optional(),
  promptHasConstraints: z.boolean().optional(),
  promptHasExamples: z.boolean().optional(),
  promptHasFormatSpec: z.boolean().optional(),
  promptQualityScore: z.number().min(0).max(100).optional(),
  promptWordCount: z.number().int().min(0).optional(),

  // Action taken
  actionType: z.enum(['accept', 'copy', 'edit', 'regenerate', 'abandon']).optional(),
  timeToActionSeconds: z.number().min(0).optional(),

  // Dialogue context
  conversationDepth: z.number().int().min(1).optional(),
  isFollowUp: z.boolean().optional(),
  hasVerificationRequest: z.boolean().optional(),
  hasPushback: z.boolean().optional(),
  hasClarificationRequest: z.boolean().optional(),

  // Outcome
  outcomeRating: z.number().int().min(1).max(5).optional(),

  // Session context
  sessionDurationSeconds: z.number().min(0).optional(),
  sessionStartHour: z.number().int().min(0).max(23).optional(),
});

export function validateSignal(req: Request, res: Response, next: NextFunction) {
  const anonymousId = req.headers['x-corrix-anonymous-id'];

  if (!anonymousId || typeof anonymousId !== 'string') {
    return res.status(400).json({ error: 'Missing X-Corrix-Anonymous-Id header' });
  }

  const result = signalSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid signal format',
      details: result.error.issues,
    });
  }

  next();
}
