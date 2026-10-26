
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./App.css";

function App() {
  const [metrics, setMetrics] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [selectedDay, setSelectedDay] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [metricsResponse, comparisonResponse] = await Promise.all([
          fetch("/api/metrics"),
fetch("/api/comparison"),
        ]);

        if (!metricsResponse.ok || !comparisonResponse.ok) {
          throw new Error("Unable to load dashboard data.");
        }

        const metricsData = await metricsResponse.json();
        const comparisonData = await comparisonResponse.json();

        setMetrics(metricsData);
        setComparison(
          comparisonData.records.map((record) => {
            const date = new Date(record.target_time);

            return {
              ...record,
              time: date.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              }),
              day: date.toISOString().slice(0, 10),
              dayNumber: date.getUTCDate(),
            };
          })
        );
      } catch (err) {
        setError(
          "Could not load dashboard data. Make sure your Python backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const days = [...new Set(comparison.map((record) => record.day))];

  const chartData = comparison
    .filter((record) => selectedDay === "all" || record.day === selectedDay)
    .map((record) => ({
      ...record,
      chartTime:
        selectedDay === "all"
          ? `${record.dayNumber} Jan ${record.time}`
          : record.time,
    }));

  const dailyErrors = Object.values(
    comparison.reduce((groups, record) => {
      if (!groups[record.day]) {
        groups[record.day] = {
          day: record.day,
          dayNumber: record.dayNumber,
          totalError: 0,
          hours: 0,
        };
      }

      groups[record.day].totalError += record.absolute_error_mw;
      groups[record.day].hours += 1;

      return groups;
    }, {})
  ).map((group) => ({
    ...group,
    mae: Number((group.totalError / group.hours).toFixed(2)),
    label: `${group.dayNumber} Jan`,
  }));

  const largestErrors = [...comparison]
    .sort((a, b) => b.absolute_error_mw - a.absolute_error_mw)
    .slice(0, 5);

  if (loading) {
    return (
      <main className="dashboard">
        <div className="loading-state">Loading WindSight dashboard...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard">
        <div className="error-state">
          <h2>Dashboard unavailable</h2>
          <p>{error}</p>
          <p>
            Start the backend in your terminal with{" "}
            <code>python -m uvicorn backend.main:app --reload</code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">W</div>
          <div>
            <h2>WindSight</h2>
            <p>Renewable Energy Intelligence</p>
          </div>
        </div>

        <div className="header-meta">
          <span className="status-dot"></span>
          Live API data
          <span className="header-divider">|</span>
          January 2026
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">WIND GENERATION ANALYTICS</p>
          <h1>Wind Forecast Dashboard</h1>
          <p className="hero-description">
            Compare day-ahead wind generation forecasts with actual UK wind
            generation and identify periods of forecast error.
          </p>
        </div>

        <div className="period-badge">01 — 31 JAN 2026</div>
      </section>

      <section className="metrics-grid">
        <div className="metric-card">
          <p className="metric-label">Mean Absolute Error</p>
          <h2>{metrics.mae_mw.toLocaleString()} <span>MW</span></h2>
          <p className="metric-description">
            Average absolute forecast error
          </p>
        </div>

        <div className="metric-card">
          <p className="metric-label">Root Mean Square Error</p>
          <h2>{metrics.rmse_mw.toLocaleString()} <span>MW</span></h2>
          <p className="metric-description">
            Penalises larger forecast errors
          </p>
        </div>

        <div className="metric-card">
          <p className="metric-label">Forecast Bias</p>
          <h2>
            {metrics.bias_mw > 0 ? "+" : ""}
            {metrics.bias_mw.toLocaleString()} <span>MW</span>
          </h2>
          <p className="metric-description">
            {metrics.bias_mw > 0
              ? "Forecasts were higher on average"
              : "Forecasts were lower on average"}
          </p>
        </div>

        <div className="metric-card">
          <p className="metric-label">Mean Absolute Percentage Error</p>
          <h2>{metrics.mape_percent}%</h2>
          <p className="metric-description">
            Average absolute error relative to actual
          </p>
        </div>
      </section>

      <section className="chart-panel">
        <div className="chart-heading">
          <div>
            <p className="panel-label">GENERATION OVER TIME</p>
            <h2>Actual vs Forecast</h2>
            <p className="small-note">
              Hourly wind generation in megawatts (MW)
            </p>
          </div>

          <div className="filter-control">
            <label htmlFor="day-filter">Filter by day</label>
            <select
              id="day-filter"
              value={selectedDay}
              onChange={(event) => setSelectedDay(event.target.value)}
            >
              <option value="all">All January</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={340}>
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#263442" />
              <XAxis
                dataKey="chartTime"
                stroke="#91a3b5"
                tick={{ fontSize: 11 }}
                interval={selectedDay === "all" ? 23 : 3}
                minTickGap={12}
              />
              <YAxis
                stroke="#91a3b5"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111c28",
                  border: "1px solid #334454",
                  borderRadius: "8px",
                  color: "#e8eef5",
                }}
                labelStyle={{ color: "#e8eef5" }}
                formatter={(value, name) => [
                  `${Number(value).toLocaleString()} MW`,
                  name,
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual_mw"
                name="Actual generation"
                stroke="#52d6a0"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="forecast_mw"
                name="Day-ahead forecast"
                stroke="#62a8ff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chart-panel">
        <div className="chart-heading">
          <div>
            <p className="panel-label">DAILY ACCURACY</p>
            <h2>Forecast Error by Day</h2>
            <p className="small-note">
              Daily mean absolute error — lower values indicate smaller errors
            </p>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dailyErrors}
              margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#263442" />
              <XAxis
                dataKey="label"
                stroke="#91a3b5"
                tick={{ fontSize: 11 }}
                interval={2}
              />
              <YAxis
                stroke="#91a3b5"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111c28",
                  border: "1px solid #334454",
                  borderRadius: "8px",
                  color: "#e8eef5",
                }}
                formatter={(value) => [
                  `${Number(value).toLocaleString()} MW`,
                  "Daily MAE",
                ]}
              />
              <Bar dataKey="mae" name="Daily MAE" radius={[4, 4, 0, 0]}>
                {dailyErrors.map((entry) => (
                  <Cell
                    key={entry.day}
                    fill={entry.mae >= 3000 ? "#ff8b72" : "#62a8ff"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel errors-panel">
        <div className="chart-heading">
          <div>
            <p className="panel-label">AREAS TO INVESTIGATE</p>
            <h2>Largest Forecast Errors</h2>
            <p className="small-note">
              The five hours with the largest absolute forecast errors
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="errors-table">
            <thead>
              <tr>
                <th>Target time (UTC)</th>
                <th>Actual (MW)</th>
                <th>Forecast (MW)</th>
                <th>Error (MW)</th>
              </tr>
            </thead>
            <tbody>
              {largestErrors.map((record) => (
                <tr key={record.target_time}>
                  <td>
                    {record.target_time.replace("T", " ").replace("Z", "")}
                  </td>
                  <td>{record.actual_mw.toLocaleString()}</td>
                  <td>{record.forecast_mw.toLocaleString()}</td>
                  <td
                    className={
                      record.error_mw > 0
                        ? "error-positive"
                        : record.error_mw < 0
                          ? "error-negative"
                          : ""
                    }
                  >
                    {record.error_mw > 0 ? "+" : ""}
                    {record.error_mw.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overview-grid">
        <div className="panel">
          <p className="panel-label">DATA COVERAGE</p>
          <h2>January 2026</h2>
          <div className="overview-stat">
            <span>Matched hourly records</span>
            <strong>{metrics.matched_hours}</strong>
          </div>
          <div className="overview-stat">
            <span>Days analysed</span>
            <strong>{metrics.days_analysed}</strong>
          </div>
          <div className="overview-stat">
            <span>Forecasted hours above actual</span>
            <strong>{metrics.overforecast_percent}%</strong>
          </div>
          <div className="overview-stat">
            <span>Forecasted hours below actual</span>
            <strong>{metrics.underforecast_percent}%</strong>
          </div>
        </div>

        <div className="panel">
          <p className="panel-label">FORECAST DIRECTION</p>
          <h2>Systematic Overforecasting</h2>
          <p className="overview-description">
            The average forecast bias is positive, meaning the selected
            day-ahead forecasts were higher than actual wind generation
            on average during this period.
          </p>
          <p className="overview-description">
            Review the daily error chart and largest-error periods to identify
            when forecast differences were most pronounced.
          </p>
        </div>
      </section>

      <section className="notice">
        <strong>Decision-support note</strong>
        <p>
          This dashboard evaluates wind generation forecasts only. It can help
          highlight uncertainty in expected wind output, but it does not
          independently determine electricity purchasing decisions. Actual
          procurement decisions also depend on demand forecasts, market prices,
          other generation sources, contracts, and trading deadlines.
        </p>
        <p>
          Forecast selection assumption: the latest forecast published by
          12:00 UTC on the day before each target date. This is an analytical
          assumption for this project, not a confirmed market trading deadline.
        </p>
      </section>

      <footer className="footer">
        <span>WindSight · Wind Generation Analytics</span>
        <span>Data period: January 2026 · Times shown in UTC</span>
      </footer>
    </main>
  );
}

export default App;
