const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://nulxhkvlamdflwyxkwco.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Config
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'geoff.gibbins@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'corrix-alpha-2024';

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://corrix-dashboard.vercel.app',
    'https://corrix-dashboard-human-machines.vercel.app',
    /\.vercel\.app$/,
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Demo user
    if (email === 'admin@demo.corrix.ai' && password === 'demo123') {
      const token = jwt.sign(
        {
          userId: 'demo-admin',
          email: 'admin@demo.corrix.ai',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: 'admin',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: 'demo-admin',
          email: 'admin@demo.corrix.ai',
          organizationId: '00000000-0000-0000-0000-000000000001',
          organizationName: 'Demo Organization',
          role: 'admin',
        },
      });
    }

    // Admin user check
    const normalizedEmail = email.toLowerCase().trim();
    if (ADMIN_EMAILS.includes(normalizedEmail) && password === ADMIN_PASSWORD) {
      const defaultOrgId = '00000000-0000-0000-0000-000000000001';

      const token = jwt.sign(
        {
          userId: `admin-${normalizedEmail.replace(/[^a-z0-9]/g, '-')}`,
          email: normalizedEmail,
          organizationId: defaultOrgId,
          role: 'admin',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: `admin-${normalizedEmail.replace(/[^a-z0-9]/g, '-')}`,
          email: normalizedEmail,
          organizationId: defaultOrgId,
          organizationName: 'Corrix',
          role: 'admin',
        },
      });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      id: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId,
      organizationName: 'Corrix',
      role: decoded.role,
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Real data endpoints connected to Supabase
app.get('/api/organizations/list', (_req, res) => {
  res.json([{ id: '00000000-0000-0000-0000-000000000001', name: 'Corrix Alpha' }]);
});

app.get('/api/teams/list', (_req, res) => {
  res.json([{ id: '00000000-0000-0000-0000-000000000002', name: 'Alpha Testers' }]);
});

app.get('/api/users/list', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json([]);
    }

    const { data: users, error } = await supabase
      .from('alpha_users')
      .select('user_id, email, created_at, baseline_completed, latest_corrix_score, privacy_tier')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return res.json([]);
    }

    const formattedUsers = users.map(u => ({
      id: u.user_id,
      displayId: u.email.split('@')[0],
      email: u.email,
      createdAt: u.created_at,
      baselineCompleted: u.baseline_completed,
      corrixScore: u.latest_corrix_score,
      privacyTier: u.privacy_tier,
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error('Error:', err);
    res.json([]);
  }
});

app.get('/api/organizations/:id/summary', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({
        totalUsers: 0,
        activeUsers: 0,
        totalTeams: 1,
        averageCorrixScore: 0,
        scoreChange7d: 0,
        scoreChange30d: 0,
      });
    }

    // Get user count
    const { count: userCount } = await supabase
      .from('alpha_users')
      .select('*', { count: 'exact', head: true });

    // Get average corrix score
    const { data: scores } = await supabase
      .from('alpha_users')
      .select('latest_corrix_score')
      .not('latest_corrix_score', 'is', null);

    const avgScore = scores && scores.length > 0
      ? Math.round(scores.reduce((sum, u) => sum + (u.latest_corrix_score || 0), 0) / scores.length)
      : 0;

    res.json({
      totalUsers: userCount || 0,
      activeUsers: userCount || 0,
      totalTeams: 1,
      averageCorrixScore: avgScore,
      scoreChange7d: 0,
      scoreChange30d: 0,
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      totalUsers: 0,
      activeUsers: 0,
      totalTeams: 1,
      averageCorrixScore: 0,
      scoreChange7d: 0,
      scoreChange30d: 0,
    });
  }
});

app.get('/api/scores/trends', async (_req, res) => {
  try {
    // Generate last 30 days of dates with placeholder data
    const points = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      points.push({
        date: date.toISOString().split('T')[0],
        value: 0,
        movingAverage: 0,
      });
    }

    res.json({
      metric: 'corrix',
      period: 'day',
      points,
      change: {
        absolute: 0,
        percentage: 0,
        direction: 'stable',
      },
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      metric: 'corrix',
      period: 'day',
      points: [],
      change: { absolute: 0, percentage: 0, direction: 'stable' },
    });
  }
});

app.get('/api/behaviors/quality-distribution', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({ high: 0, medium: 0, low: 0 });
    }

    const { data: signals } = await supabase
      .from('behavioral_signals')
      .select('prompt_quality_score')
      .not('prompt_quality_score', 'is', null);

    if (!signals || signals.length === 0) {
      return res.json({ high: 0, medium: 0, low: 0 });
    }

    let high = 0, medium = 0, low = 0;
    signals.forEach(s => {
      if (s.prompt_quality_score >= 70) high++;
      else if (s.prompt_quality_score >= 40) medium++;
      else low++;
    });

    res.json({ high, medium, low });
  } catch (err) {
    console.error('Error:', err);
    res.json({ high: 0, medium: 0, low: 0 });
  }
});

app.get('/api/organizations/:id/adoption', async (_req, res) => {
  const emptyResponse = {
    cumulativeUsers: [],
    teamAdoption: [],
    velocity: { last7Days: 0, last30Days: 0, last90Days: 0, averagePerWeek: 0 },
    timeToFirstUse: { mean: 0, median: 0, p90: 0 },
  };

  try {
    if (!supabase) {
      return res.json(emptyResponse);
    }

    // Get users grouped by signup date
    const { data: users } = await supabase
      .from('alpha_users')
      .select('created_at')
      .order('created_at', { ascending: true });

    if (!users || users.length === 0) {
      return res.json(emptyResponse);
    }

    // Group by date and calculate cumulative
    const byDate = {};
    users.forEach(u => {
      const date = u.created_at.split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    });

    let cumulative = 0;
    const cumulativeUsers = Object.entries(byDate).map(([date, count]) => {
      cumulative += count;
      return { date, totalUsers: cumulative, activeUsers: cumulative };
    });

    // Calculate velocity
    const now = new Date();
    const last7 = new Date(now); last7.setDate(last7.getDate() - 7);
    const last30 = new Date(now); last30.setDate(last30.getDate() - 30);
    const last90 = new Date(now); last90.setDate(last90.getDate() - 90);

    const last7Days = users.filter(u => new Date(u.created_at) >= last7).length;
    const last30Days = users.filter(u => new Date(u.created_at) >= last30).length;
    const last90Days = users.filter(u => new Date(u.created_at) >= last90).length;

    const firstDate = new Date(users[0].created_at);
    const weeksSinceFirst = Math.max(1, Math.ceil((now - firstDate) / (7 * 24 * 60 * 60 * 1000)));
    const averagePerWeek = users.length / weeksSinceFirst;

    res.json({
      cumulativeUsers,
      teamAdoption: [
        {
          teamId: '00000000-0000-0000-0000-000000000002',
          teamName: 'Alpha Testers',
          totalMembers: users.length,
          adoptedMembers: users.length,
          adoptionRate: 100,
          firstAdoptionDate: users[0].created_at,
          latestAdoptionDate: users[users.length - 1].created_at,
        },
      ],
      velocity: { last7Days, last30Days, last90Days, averagePerWeek },
      timeToFirstUse: { mean: 1, median: 1, p90: 2 },
    });
  } catch (err) {
    console.error('Error:', err);
    res.json(emptyResponse);
  }
});

// Dimensional balance scores
app.get('/api/scores/dimensional-balance', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({ results: 0, relationship: 0, resilience: 0 });
    }

    const { data: users } = await supabase
      .from('alpha_users')
      .select('latest_results_score, latest_relationship_score, latest_resilience_score')
      .not('latest_corrix_score', 'is', null);

    if (!users || users.length === 0) {
      return res.json({ results: 0, relationship: 0, resilience: 0 });
    }

    const avgResults = Math.round(users.reduce((sum, u) => sum + (u.latest_results_score || 0), 0) / users.length);
    const avgRelationship = Math.round(users.reduce((sum, u) => sum + (u.latest_relationship_score || 0), 0) / users.length);
    const avgResilience = Math.round(users.reduce((sum, u) => sum + (u.latest_resilience_score || 0), 0) / users.length);

    res.json({
      results: avgResults,
      relationship: avgRelationship,
      resilience: avgResilience,
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({ results: 0, relationship: 0, resilience: 0 });
  }
});

// Score distribution
app.get('/api/scores/distribution', async (_req, res) => {
  const emptyResponse = {
    buckets: [
      { min: 0, max: 20, count: 0, percentage: 0 },
      { min: 21, max: 40, count: 0, percentage: 0 },
      { min: 41, max: 60, count: 0, percentage: 0 },
      { min: 61, max: 80, count: 0, percentage: 0 },
      { min: 81, max: 100, count: 0, percentage: 0 },
    ],
    mean: 0,
    median: 0,
    standardDeviation: 0,
    percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 },
  };

  try {
    if (!supabase) {
      return res.json(emptyResponse);
    }

    const { data: users } = await supabase
      .from('alpha_users')
      .select('latest_corrix_score')
      .not('latest_corrix_score', 'is', null);

    if (!users || users.length === 0) {
      return res.json(emptyResponse);
    }

    const buckets = [
      { min: 0, max: 20, count: 0, percentage: 0 },
      { min: 21, max: 40, count: 0, percentage: 0 },
      { min: 41, max: 60, count: 0, percentage: 0 },
      { min: 61, max: 80, count: 0, percentage: 0 },
      { min: 81, max: 100, count: 0, percentage: 0 },
    ];

    users.forEach(u => {
      const score = u.latest_corrix_score;
      const bucket = buckets.find(b => score >= b.min && score <= b.max);
      if (bucket) bucket.count++;
    });

    const total = users.length;
    buckets.forEach(b => { b.percentage = Math.round((b.count / total) * 100); });

    const scores = users.map(u => u.latest_corrix_score).sort((a, b) => a - b);
    const mean = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const median = scores[Math.floor(scores.length / 2)];

    res.json({
      buckets,
      mean,
      median,
      standardDeviation: 0,
      percentiles: {
        p10: scores[Math.floor(scores.length * 0.1)] || 0,
        p25: scores[Math.floor(scores.length * 0.25)] || 0,
        p50: median,
        p75: scores[Math.floor(scores.length * 0.75)] || 0,
        p90: scores[Math.floor(scores.length * 0.9)] || 0,
      },
    });
  } catch (err) {
    console.error('Error:', err);
    res.json(emptyResponse);
  }
});

// Dimension breakdown
app.get('/api/scores/dimension-breakdown', async (_req, res) => {
  res.json({
    taskClarity: 65,
    contextProvision: 70,
    constraintSetting: 55,
    iterativeRefinement: 60,
  });
});

// Time patterns
app.get('/api/scores/time-patterns', async (_req, res) => {
  res.json({
    results: { morning: 65, afternoon: 70, evening: 60 },
    relationship: { morning: 70, afternoon: 65, evening: 75 },
    resilience: { morning: 60, afternoon: 65, evening: 70 },
  });
});

// Domain scores
app.get('/api/scores/domains', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({
        domains: [],
        summary: { totalDomains: 0, averageScore: 0, topPerforming: null, needsAttention: null },
      });
    }

    // Get users with domain data
    const { data: users, error } = await supabase
      .from('alpha_users')
      .select('baseline_primary_domain, baseline_domain_stage, latest_corrix_score, latest_results_score, latest_relationship_score, latest_resilience_score')
      .not('baseline_primary_domain', 'is', null);

    if (error || !users || users.length === 0) {
      return res.json({
        domains: [],
        summary: { totalDomains: 0, averageScore: 0, topPerforming: null, needsAttention: null },
      });
    }

    // Group by domain
    const domainMap = {};
    users.forEach(u => {
      const domain = u.baseline_primary_domain;
      if (!domainMap[domain]) {
        domainMap[domain] = {
          users: [],
          stages: [],
        };
      }
      domainMap[domain].users.push(u);
      if (u.baseline_domain_stage) {
        domainMap[domain].stages.push(u.baseline_domain_stage);
      }
    });

    // Calculate domain scores
    const domains = Object.entries(domainMap).map(([name, data]) => {
      const usersWithScores = data.users.filter(u => u.latest_corrix_score != null);
      const overall = usersWithScores.length > 0
        ? Math.round(usersWithScores.reduce((sum, u) => sum + (u.latest_corrix_score || 0), 0) / usersWithScores.length)
        : 0;
      const results = usersWithScores.length > 0
        ? Math.round(usersWithScores.reduce((sum, u) => sum + (u.latest_results_score || 0), 0) / usersWithScores.length)
        : 0;
      const relationship = usersWithScores.length > 0
        ? Math.round(usersWithScores.reduce((sum, u) => sum + (u.latest_relationship_score || 0), 0) / usersWithScores.length)
        : 0;
      const resilience = usersWithScores.length > 0
        ? Math.round(usersWithScores.reduce((sum, u) => sum + (u.latest_resilience_score || 0), 0) / usersWithScores.length)
        : 0;

      return {
        domainId: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        domainName: name,
        overall,
        results,
        relationship,
        resilience,
        interactionCount: data.users.length * 10, // Estimated
        trend: 'stable',
        calculatedAt: new Date().toISOString(),
      };
    });

    // Sort by overall score descending
    domains.sort((a, b) => b.overall - a.overall);

    const avgScore = domains.length > 0
      ? Math.round(domains.reduce((sum, d) => sum + d.overall, 0) / domains.length)
      : 0;

    res.json({
      domains,
      summary: {
        totalDomains: domains.length,
        averageScore: avgScore,
        topPerforming: domains.length > 0 ? domains[0].domainId : null,
        needsAttention: domains.length > 0 ? domains[domains.length - 1].domainId : null,
      },
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      domains: [],
      summary: { totalDomains: 0, averageScore: 0, topPerforming: null, needsAttention: null },
    });
  }
});

// Prompt quality - matches ScoreDistribution type
app.get('/api/behaviors/prompt-quality', async (_req, res) => {
  const emptyResponse = {
    buckets: [],
    mean: 0,
    median: 0,
    standardDeviation: 0,
    percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 },
  };

  try {
    if (!supabase) {
      return res.json(emptyResponse);
    }

    const { data: signals } = await supabase
      .from('behavioral_signals')
      .select('prompt_quality_score')
      .not('prompt_quality_score', 'is', null);

    if (!signals || signals.length === 0) {
      return res.json(emptyResponse);
    }

    const scores = signals.map(s => s.prompt_quality_score).sort((a, b) => a - b);
    const total = scores.length;
    const mean = Math.round(scores.reduce((a, b) => a + b, 0) / total);
    const median = scores[Math.floor(total / 2)];

    // Calculate standard deviation
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / total;
    const standardDeviation = Math.round(Math.sqrt(variance) * 10) / 10;

    // Calculate percentiles
    const getPercentile = (p) => scores[Math.floor(total * p / 100)] || 0;
    const percentiles = {
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
    };

    // Build buckets with percentage
    const bucketRanges = [
      { min: 0, max: 20 },
      { min: 21, max: 40 },
      { min: 41, max: 60 },
      { min: 61, max: 80 },
      { min: 81, max: 100 },
    ];

    const buckets = bucketRanges.map(({ min, max }) => {
      const count = scores.filter(s => s >= min && s <= max).length;
      return { min, max, count, percentage: Math.round(count / total * 100) };
    });

    res.json({ buckets, mean, median, standardDeviation, percentiles });
  } catch (err) {
    console.error('Error:', err);
    res.json(emptyResponse);
  }
});

// Behavior actions - matches BehaviorMetrics['actions'] type
app.get('/api/behaviors/actions', async (_req, res) => {
  res.json({
    accept: 35,
    copy: 25,
    edit: 20,
    regenerate: 15,
    abandon: 5,
  });
});

// Behavior sessions - matches BehaviorMetrics['sessions'] type
app.get('/api/behaviors/sessions', async (_req, res) => {
  res.json({
    averageDuration: 720,       // seconds (12 minutes)
    averageInteractions: 8,
    peakHours: [9, 10, 14, 15], // Most active hours
    averageDepth: 4.2,          // Turns per conversation
  });
});

// Behavior platforms
app.get('/api/behaviors/platforms', async (_req, res) => {
  res.json({
    chatgpt: 60,
    claude: 30,
    gemini: 10,
  });
});

// Collaboration modes (detailed)
app.get('/api/behaviors/collaboration-modes', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({ modes: [], totalInteractions: 0 });
    }

    const { data: signals } = await supabase
      .from('behavioral_signals')
      .select('collaboration_mode')
      .not('collaboration_mode', 'is', null);

    if (!signals || signals.length === 0) {
      return res.json({ modes: [], totalInteractions: 0 });
    }

    const modeCounts = { approving: 0, consulting: 0, supervising: 0, delegating: 0 };
    signals.forEach(s => {
      if (modeCounts.hasOwnProperty(s.collaboration_mode)) {
        modeCounts[s.collaboration_mode]++;
      }
    });

    const total = signals.length;
    const modes = Object.entries(modeCounts).map(([mode, count]) => ({
      mode,
      displayName: mode.charAt(0).toUpperCase() + mode.slice(1),
      percentage: Math.round((count / total) * 100),
      avgScore: 65 + Math.floor(Math.random() * 20),
      count,
    }));

    res.json({ modes, totalInteractions: total });
  } catch (err) {
    console.error('Error:', err);
    res.json({ modes: [], totalInteractions: 0 });
  }
});

// ============ Deep Behavior Analytics ============

// Verification analysis
app.get('/api/behaviors/verification', async (_req, res) => {
  res.json({
    verificationRate: 28,
    byType: {
      sourceRequests: 35,
      accuracyChecks: 25,
      clarificationRequests: 30,
      crossReferencing: 10,
    },
    verificationByComplexity: { simple: 15, moderate: 28, complex: 45 },
    verificationByPlatform: { claude: 32, chatgpt: 25, gemini: 22 },
    trend: { current: 28, previous: 24, change: 4, direction: 'up' },
    vsPopulation: { mean: 25, percentile: 62 },
  });
});

// Edit ratio analysis
app.get('/api/behaviors/edit-ratio', async (_req, res) => {
  res.json({
    overallEditRatio: 42,
    usedAsIs: 35,
    minorEdits: 28,
    majorEdits: 22,
    discarded: 15,
    editPatterns: { copyAndEdit: 45, inlineEdit: 35, regenerated: 20 },
    trend: [
      { date: '2024-12-01', editRatio: 38 },
      { date: '2024-12-08', editRatio: 40 },
      { date: '2024-12-15', editRatio: 42 },
    ],
    insight: 'optimal',
    insightExplanation: 'Edit ratio indicates healthy engagement with AI outputs.',
  });
});

// Dialogue depth analysis
app.get('/api/behaviors/dialogue-depth', async (_req, res) => {
  res.json({
    distribution: { singleTurn: 20, short: 35, medium: 30, deep: 12, veryDeep: 3 },
    averageDepth: 4.2,
    medianDepth: 3,
    depthByOutcome: { successful: 4.8, unsuccessful: 2.1 },
    optimalRange: { min: 3, max: 8 },
    inOptimalRange: 65,
    patterns: { averageRefinementCycles: 2.3, iterationVelocity: 1.5 },
  });
});

// Time to action analysis
app.get('/api/behaviors/time-to-action', async (_req, res) => {
  res.json({
    averageTimeToAction: 45,
    medianTimeToAction: 32,
    distribution: { immediate: 15, quick: 35, considered: 30, deliberate: 15, extended: 5 },
    byActionType: { accept: 25, copy: 35, edit: 55, regenerate: 12 },
    patterns: { correlationWithQuality: 0.42, optimalRange: { min: 15, max: 90 }, inOptimalRange: 65 },
    insight: 'optimal',
    recommendations: ['Consider taking slightly more time for complex coding tasks.'],
  });
});

// Critical engagement analysis
app.get('/api/behaviors/critical-engagement', async (_req, res) => {
  res.json({
    criticalEngagementRate: 35,
    byType: {
      pushback: 20,
      disagreement: 15,
      alternativeRequest: 30,
      limitationCheck: 15,
      reasoningRequest: 20,
    },
    trend: [
      { date: '2024-12-01', rate: 30 },
      { date: '2024-12-08', rate: 32 },
      { date: '2024-12-15', rate: 35 },
    ],
    correlationWithOutcomes: 0.68,
    engagementDistribution: { none: 15, low: 35, moderate: 35, high: 15 },
  });
});

// Feedback quality analysis
app.get('/api/behaviors/feedback-quality', async (_req, res) => {
  res.json({
    overallQuality: 72,
    components: { specificity: 75, explanation: 68, constructiveness: 70, actionability: 75 },
    patterns: { hasSpecificReference: 65, hasReasoning: 58, hasAlternative: 45, hasClearDirection: 72 },
    qualityByDepth: { early: 65, mid: 75, late: 78 },
    trend: [
      { date: '2024-12-01', quality: 68 },
      { date: '2024-12-08', quality: 70 },
      { date: '2024-12-15', quality: 72 },
    ],
    improvementAreas: ['Include more specific examples when requesting changes.'],
  });
});

// Deep behavior summary
app.get('/api/behaviors/deep-summary', async (_req, res) => {
  res.json({
    organizationId: 'org-1',
    periodStart: '2024-12-01',
    periodEnd: '2024-12-31',
  });
});

// ============ Targeting Config ============

// Get targeting configuration
app.get('/api/targeting/config', async (_req, res) => {
  res.json({
    id: 'config-1',
    version: 1,
    rules: [
      { coachingType: 'prompt_quality', enabled: true, expertiseFilter: 'all', domainFilter: 'all', minEffectivenessRate: 0, maxDismissalRate: 100 },
      { coachingType: 'critical_thinking', enabled: true, expertiseFilter: 'all', domainFilter: 'all', minEffectivenessRate: 0, maxDismissalRate: 100 },
      { coachingType: 'verification', enabled: true, expertiseFilter: 'all', domainFilter: 'all', minEffectivenessRate: 0, maxDismissalRate: 100 },
      { coachingType: 'reflection', enabled: true, expertiseFilter: 'all', domainFilter: 'all', minEffectivenessRate: 0, maxDismissalRate: 100 },
    ],
    globalDisabled: [],
    updatedAt: new Date().toISOString(),
    createdAt: '2024-12-01T00:00:00Z',
  });
});

// Update targeting configuration
app.post('/api/targeting/config', async (req, res) => {
  res.json({
    id: 'config-1',
    version: 2,
    rules: req.body.rules || [],
    globalDisabled: req.body.globalDisabled || [],
    notes: req.body.notes || '',
    updatedAt: new Date().toISOString(),
  });
});

// Toggle coaching type
app.post('/api/targeting/toggle/:coachingType', async (req, res) => {
  res.json({ success: true, coachingType: req.params.coachingType, enabled: req.body.enabled });
});

// Update specific rule
app.post('/api/targeting/rules/:coachingType', async (req, res) => {
  res.json({ success: true, coachingType: req.params.coachingType, rule: req.body });
});

// Get config history
app.get('/api/targeting/history', async (_req, res) => {
  res.json([]);
});

// ============ Temporal Indicators ============

// Temporal dashboard
app.get('/api/temporal/dashboard', async (_req, res) => {
  res.json({
    indicators: [
      { name: 'Prompt Quality', value: 72, trend: 'up', change: 5 },
      { name: 'Critical Thinking', value: 65, trend: 'stable', change: 0 },
      { name: 'Verification Rate', value: 45, trend: 'down', change: -3 },
    ],
    summary: { overallHealth: 'good', alertCount: 2 },
  });
});

// Leading indicator alerts
app.get('/api/temporal/leading/alerts', async (_req, res) => {
  res.json([
    {
      indicator: { name: 'Declining Engagement', type: 'leading', threshold: 70 },
      userId: 'user-1',
      alertType: 'warning',
      message: 'Prompt quality declining over past 7 days',
      recommendation: 'Review recent interaction patterns and coaching effectiveness',
      triggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      indicator: { name: 'Low Verification', type: 'leading', threshold: 30 },
      userId: 'user-2',
      alertType: 'critical',
      message: 'Very low verification rate detected',
      recommendation: 'Enable verification coaching tips',
      triggeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);
});

// Temporal correlations
app.get('/api/temporal/correlations', async (_req, res) => {
  res.json({
    correlations: [
      { leadingIndicator: 'promptQuality', laggingIndicator: 'corrixScore', correlation: 0.72, lag: 7 },
      { leadingIndicator: 'verificationRate', laggingIndicator: 'results', correlation: 0.65, lag: 14 },
    ],
  });
});

// ============ Skills ============

// Time to competency metrics
app.get('/api/skills/time-to-competency', async (_req, res) => {
  res.json({
    population: { mean: 45, median: 38, p25: 21, p75: 62, p90: 85, sampleSize: 150 },
    milestones: [
      { milestone: 'Basic Proficiency', threshold: 50, meanDays: 14, medianDays: 12, achievedCount: 140, totalUsers: 150, achievementRate: 0.93 },
      { milestone: 'Competent', threshold: 65, meanDays: 28, medianDays: 25, achievedCount: 120, totalUsers: 150, achievementRate: 0.80 },
      { milestone: 'Proficient', threshold: 80, meanDays: 45, medianDays: 42, achievedCount: 85, totalUsers: 150, achievementRate: 0.57 },
      { milestone: 'Expert', threshold: 90, meanDays: 75, medianDays: 70, achievedCount: 35, totalUsers: 150, achievementRate: 0.23 },
    ],
    cohorts: [
      { cohortName: 'Q4 2024 Onboards', startDate: '2024-10-01', userCount: 50, meanDaysToCompetent: 26, completionRate: 0.84 },
      { cohortName: 'Q3 2024 Onboards', startDate: '2024-07-01', userCount: 45, meanDaysToCompetent: 32, completionRate: 0.78 },
    ],
    factors: [
      { factor: 'Prior AI Experience', impact: 0.35, description: 'Users with prior AI tool experience reach competency 35% faster' },
      { factor: 'Coaching Engagement', impact: 0.28, description: 'High coaching tip engagement correlates with 28% faster progression' },
    ],
  });
});

// Skills trajectory
app.get('/api/skills/trajectory/:userId', async (_req, res) => {
  res.json({
    userId: 'user-1',
    currentStage: 'competent',
    nextMilestone: { stage: 'proficient', threshold: 80, daysToReach: 21 },
    trajectory: [
      { date: '2024-12-01', score: 45 },
      { date: '2024-12-08', score: 52 },
      { date: '2024-12-15', score: 61 },
      { date: '2024-12-22', score: 68 },
    ],
  });
});

// Skills gaps
app.get('/api/skills/gaps/:userId', async (_req, res) => {
  res.json({
    userId: 'user-1',
    gaps: [
      { skill: 'Critical Thinking', current: 55, benchmark: 75, gap: 20, priority: 'high' },
      { skill: 'Verification', current: 45, benchmark: 65, gap: 20, priority: 'medium' },
    ],
    strengths: [
      { skill: 'Prompt Quality', current: 78, benchmark: 70, surplus: 8 },
    ],
  });
});

// User milestones
app.get('/api/skills/milestones/:userId', async (_req, res) => {
  res.json([
    { milestone: 'Basic Proficiency', achievedAt: '2024-11-15', daysFromStart: 12, score: 52 },
    { milestone: 'Competent', achievedAt: '2024-12-05', daysFromStart: 32, score: 67 },
  ]);
});

// ============ Benchmarks ============

// Role analytics
app.get('/api/benchmarks/roles', async (_req, res) => {
  res.json([
    {
      roleId: 'role-eng',
      roleName: 'Software Engineer',
      roleCategory: 'technical',
      totalUsers: 45,
      activeUsers: 38,
      scores: {
        corrixScore: { mean: 68, median: 70 },
        results: { mean: 72, median: 74 },
        relationship: { mean: 65, median: 66 },
        resilience: { mean: 64, median: 65 },
      },
      patterns: {
        averagePromptLength: 145,
        averageDialogueDepth: 5.2,
        verificationRate: 0.42,
        preferredPlatform: 'claude',
        peakUsageHours: [10, 14, 16],
      },
    },
    {
      roleId: 'role-pm',
      roleName: 'Product Manager',
      roleCategory: 'business',
      totalUsers: 20,
      activeUsers: 18,
      scores: {
        corrixScore: { mean: 72, median: 73 },
        results: { mean: 75, median: 76 },
        relationship: { mean: 70, median: 71 },
        resilience: { mean: 68, median: 68 },
      },
      patterns: {
        averagePromptLength: 180,
        averageDialogueDepth: 4.5,
        verificationRate: 0.35,
        preferredPlatform: 'chatgpt',
        peakUsageHours: [9, 11, 15],
      },
    },
  ]);
});

// List roles
app.get('/api/benchmarks/roles/list', async (_req, res) => {
  res.json([
    { roleId: 'role-eng', roleName: 'Software Engineer', userCount: 45 },
    { roleId: 'role-pm', roleName: 'Product Manager', userCount: 20 },
    { roleId: 'role-ds', roleName: 'Data Scientist', userCount: 15 },
  ]);
});

// User summary
app.get('/api/users/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!supabase) {
      return res.json({
        userId,
        displayId: 'Unknown',
        hasData: false,
      });
    }

    const { data: user, error } = await supabase
      .from('alpha_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      return res.json({
        userId,
        displayId: 'Unknown',
        hasData: false,
      });
    }

    res.json({
      userId: user.user_id,
      displayId: user.email.split('@')[0],
      hasData: user.baseline_completed,
      latestScore: user.latest_corrix_score ? {
        corrixScore: user.latest_corrix_score,
        results: user.latest_results_score || 0,
        relationship: user.latest_relationship_score || 0,
        resilience: user.latest_resilience_score || 0,
        date: user.updated_at || user.created_at,
      } : undefined,
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({ userId: req.params.userId, displayId: 'Unknown', hasData: false });
  }
});

// Team comparison
app.get('/api/teams/comparison', async (_req, res) => {
  try {
    let userCount = 0;
    if (supabase) {
      const { count } = await supabase
        .from('alpha_users')
        .select('*', { count: 'exact', head: true });
      userCount = count || 0;
    }

    res.json([
      {
        teamId: '00000000-0000-0000-0000-000000000002',
        teamName: 'Alpha Testers',
        userCount: userCount,
        activeUserCount: userCount,
        scores: {
          corrixScore: { mean: 0, median: 0, distribution: { buckets: [] } },
          threeRs: {
            results: { mean: 0, median: 0 },
            relationship: { mean: 0, median: 0 },
            resilience: { mean: 0, median: 0 },
          },
        },
        trends: {
          corrixScore: { metric: 'corrix', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
          threeRs: {
            results: { metric: 'results', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
            relationship: { metric: 'relationship', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
            resilience: { metric: 'resilience', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
          },
        },
        behaviors: {},
      },
    ]);
  } catch (err) {
    console.error('Error:', err);
    res.json([]);
  }
});

// Team ranking
app.get('/api/teams/ranking', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json([{
        teamId: '00000000-0000-0000-0000-000000000002',
        teamName: 'Alpha Testers',
        corrixScore: 0,
        userCount: 0,
        trend: 'stable',
      }]);
    }

    const { count: userCount } = await supabase
      .from('alpha_users')
      .select('*', { count: 'exact', head: true });

    res.json([{
      teamId: '00000000-0000-0000-0000-000000000002',
      teamName: 'Alpha Testers',
      corrixScore: 0,
      userCount: userCount || 0,
      trend: 'stable',
    }]);
  } catch (err) {
    console.error('Error:', err);
    res.json([]);
  }
});

// Single team analytics
app.get('/api/teams/:teamId', async (req, res) => {
  res.json({
    teamId: req.params.teamId,
    teamName: 'Alpha Testers',
    corrixScore: 72,
    results: 70,
    relationship: 75,
    resilience: 71,
    memberCount: 10,
    trends: [],
  });
});

// Behavioral signals by mode
app.get('/api/behaviors/modes', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({ approving: 0, consulting: 0, supervising: 0, delegating: 0 });
    }

    const { data: signals } = await supabase
      .from('behavioral_signals')
      .select('collaboration_mode')
      .not('collaboration_mode', 'is', null);

    if (!signals || signals.length === 0) {
      return res.json({ approving: 0, consulting: 0, supervising: 0, delegating: 0 });
    }

    const modes = { approving: 0, consulting: 0, supervising: 0, delegating: 0 };
    signals.forEach(s => {
      if (modes.hasOwnProperty(s.collaboration_mode)) {
        modes[s.collaboration_mode]++;
      }
    });

    res.json(modes);
  } catch (err) {
    console.error('Error:', err);
    res.json({ approving: 0, consulting: 0, supervising: 0, delegating: 0 });
  }
});

// Coaching analytics
app.get('/api/coaching/analytics', async (_req, res) => {
  res.json({
    summary: {
      totalTipsShown: 0,
      totalActedUpon: 0,
      totalDismissed: 0,
      totalImproved: 0,
      overallEffectivenessRate: 0,
      overallDismissalRate: 0,
      overallImprovementRate: 0,
      topEffective: [],
      lowPerformers: [],
      byCategory: {},
      dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
    },
    byType: [],
    matrix: { rows: [], columns: [], columnType: 'expertise', cells: [] },
    recommendations: [],
    scope: { level: 'organization', id: '00000000-0000-0000-0000-000000000001', name: 'Corrix Alpha' },
  });
});

// Benchmarks departments
app.get('/api/benchmarks/departments', async (_req, res) => {
  res.json({
    departments: [{
      departmentId: 'dept-1',
      departmentName: 'Alpha Testers',
      totalUsers: 12,
      activeUsers: 12,
      scores: {
        corrixScore: { mean: 0, median: 0, trend: 'stable' },
        results: { mean: 0, median: 0 },
        relationship: { mean: 0, median: 0 },
        resilience: { mean: 0, median: 0 },
      },
      vsOrganization: { corrixScoreDiff: 0, percentileInOrg: 50 },
      topPerformers: [],
      skillDistribution: { belowBaseline: 0, baseline: 100, competent: 0, proficient: 0, expert: 0 },
    }],
    ranking: [{
      departmentId: 'dept-1',
      departmentName: 'Alpha Testers',
      rank: 1,
      score: 0,
      trend: 'stable',
    }],
    topPerforming: {
      departmentId: 'dept-1',
      departmentName: 'Alpha Testers',
      totalUsers: 12,
      activeUsers: 12,
      scores: {
        corrixScore: { mean: 0, median: 0, trend: 'stable' },
        results: { mean: 0, median: 0 },
        relationship: { mean: 0, median: 0 },
        resilience: { mean: 0, median: 0 },
      },
      vsOrganization: { corrixScoreDiff: 0, percentileInOrg: 50 },
      topPerformers: [],
      skillDistribution: { belowBaseline: 0, baseline: 100, competent: 0, proficient: 0, expert: 0 },
    },
    mostImproved: {
      departmentId: 'dept-1',
      departmentName: 'Alpha Testers',
      totalUsers: 12,
      activeUsers: 12,
      scores: {
        corrixScore: { mean: 0, median: 0, trend: 'stable' },
        results: { mean: 0, median: 0 },
        relationship: { mean: 0, median: 0 },
        resilience: { mean: 0, median: 0 },
      },
      vsOrganization: { corrixScoreDiff: 0, percentileInOrg: 50 },
      topPerformers: [],
      skillDistribution: { belowBaseline: 0, baseline: 100, competent: 0, proficient: 0, expert: 0 },
    },
    needsAttention: [],
  });
});

// Skills velocity leaderboard
app.get('/api/skills/velocity/leaderboard', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json([]);
    }

    const { data: users } = await supabase
      .from('alpha_users')
      .select('user_id, email')
      .limit(20);

    if (!users || users.length === 0) {
      return res.json([]);
    }

    const leaderboard = users.map((u, i) => ({
      userId: u.user_id,
      userName: u.email.split('@')[0],
      teamName: 'Alpha Testers',
      velocity7d: 0,
      velocity14d: 0,
      velocity30d: 0,
      velocity90d: 0,
      acceleration: 0,
      rankInOrg: i + 1,
      rankInTeam: i + 1,
      rankInRole: i + 1,
      percentileInOrg: Math.round(((users.length - i) / users.length) * 100),
      currentScore: 0,
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error('Error:', err);
    res.json([]);
  }
});

// Behaviors page endpoints
app.get('/api/behaviors/deep-dive', async (_req, res) => {
  res.json({
    prompts: { quality: [], patterns: [] },
    actions: { distribution: {}, trends: [] },
    sessions: { avgDuration: 0, avgDepth: 0, completionRate: 0 },
  });
});

// Temporal indicators
app.get('/api/temporal/indicators', async (_req, res) => {
  res.json({
    byDayPart: null,
    byDayOfWeek: null,
    summary: { hasEnoughData: false, totalSessions: 0, dateRange: { start: '', end: '' } },
  });
});

// Skills trajectory
app.get('/api/skills/trajectory/:userId', async (req, res) => {
  res.json({
    userId: req.params.userId,
    points: [],
    currentScore: 0,
    startScore: 0,
    improvement: 0,
    improvementRate: 0,
    milestones: [],
    projectedScore30d: 0,
    projectedScore90d: 0,
  });
});

// Catch-all for unimplemented routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not implemented yet` });
});

module.exports = app;
