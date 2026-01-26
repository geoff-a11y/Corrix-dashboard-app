export function SettingsPage() {
  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Configure dashboard and export data</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-text-primary mb-4">Team Configuration</h3>
        <p className="text-text-muted">Coming soon - manage teams and user assignments</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-text-primary mb-4">Coaching Configuration</h3>
        <p className="text-text-muted">Coming soon - configure coaching tip settings per team</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-text-primary mb-4">Export Data</h3>
        <div className="flex gap-4">
          <button className="btn btn-secondary">Download CSV Report</button>
          <button className="btn btn-secondary">Download PDF Summary</button>
        </div>
      </div>
    </div>
  );
}
