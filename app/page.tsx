export default function HomePage() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Damstrong Dashboard</h1>
      <p style={{ marginTop: 10 }}>
        Netlify password protection is enabled. App auth is disabled.
      </p>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Next steps</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.6 }}>
          <li>Load your CSV exports</li>
          <li>Build the first charts (time series + day/hour heatmap)</li>
          <li>Add filters (date range, campaign, device)</li>
        </ul>
      </div>
    </div>
  );
}
