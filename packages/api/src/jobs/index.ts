export { runSkillSnapshotJob } from './SkillSnapshotJob.js';
export { runBenchmarkUpdateJob } from './BenchmarkUpdateJob.js';
export { runScoreTrendAggregationJob } from './ScoreTrendAggregationJob.js';
export { runTeamRankingAggregationJob } from './TeamRankingAggregationJob.js';
export { runAlphaUserSyncJob } from './AlphaUserSyncJob.js';

// Simple CLI runner for jobs
const args = process.argv.slice(2);

if (args.includes('--run')) {
  const jobName = args[args.indexOf('--run') + 1];

  (async () => {
    try {
      switch (jobName) {
        case 'skill-snapshot':
          const { runSkillSnapshotJob } = await import('./SkillSnapshotJob.js');
          await runSkillSnapshotJob();
          break;
        case 'benchmark-update':
          const { runBenchmarkUpdateJob } = await import('./BenchmarkUpdateJob.js');
          await runBenchmarkUpdateJob();
          break;
        case 'score-trend-aggregation':
          const { runScoreTrendAggregationJob } = await import('./ScoreTrendAggregationJob.js');
          await runScoreTrendAggregationJob();
          break;
        case 'team-ranking-aggregation':
          const { runTeamRankingAggregationJob } = await import('./TeamRankingAggregationJob.js');
          await runTeamRankingAggregationJob();
          break;
        case 'alpha-user-sync':
          const { runAlphaUserSyncJob } = await import('./AlphaUserSyncJob.js');
          await runAlphaUserSyncJob();
          break;
        default:
          console.error(`Unknown job: ${jobName}`);
          console.log('Available jobs: skill-snapshot, benchmark-update, score-trend-aggregation, team-ranking-aggregation, alpha-user-sync');
          process.exit(1);
      }
      process.exit(0);
    } catch (error) {
      console.error('Job failed:', error);
      process.exit(1);
    }
  })();
}
