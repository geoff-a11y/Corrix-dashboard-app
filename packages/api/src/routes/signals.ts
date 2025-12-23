import { Router } from 'express';
import { SignalIngestionService } from '../services/SignalIngestionService.js';
import { validateSignal } from '../middleware/validation.js';

const router = Router();
const ingestionService = new SignalIngestionService();

/**
 * POST /api/v1/signals
 * Receives Tier 2 anonymized signals from Corrix Chrome extension
 *
 * Headers:
 *   - X-Corrix-Anonymous-Id: Hashed user identifier
 *   - X-Corrix-Org-Id: Organization identifier (if enterprise deployment)
 */
router.post('/', validateSignal, async (req, res) => {
  const anonymousId = req.headers['x-corrix-anonymous-id'] as string;
  const orgId = req.headers['x-corrix-org-id'] as string | undefined;

  try {
    await ingestionService.ingestSignal({
      anonymousId,
      organizationId: orgId,
      signal: req.body,
    });

    res.status(202).json({ status: 'accepted' });
  } catch (error) {
    console.error('[Signals] Ingestion error:', error);
    res.status(500).json({ error: 'Ingestion failed' });
  }
});

/**
 * POST /api/v1/signals/batch
 * Batch ingestion for catching up after offline periods
 */
router.post('/batch', async (req, res) => {
  const anonymousId = req.headers['x-corrix-anonymous-id'] as string;
  const orgId = req.headers['x-corrix-org-id'] as string | undefined;
  const { signals } = req.body;

  if (!Array.isArray(signals)) {
    return res.status(400).json({ error: 'signals must be an array' });
  }

  try {
    await ingestionService.ingestBatch({
      anonymousId,
      organizationId: orgId,
      signals,
    });

    res.status(202).json({
      status: 'accepted',
      count: signals.length,
    });
  } catch (error) {
    console.error('[Signals] Batch ingestion error:', error);
    res.status(500).json({ error: 'Batch ingestion failed' });
  }
});

export default router;
