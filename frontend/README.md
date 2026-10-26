# WindSight — Wind Energy Forecast Dashboard

WindSight is a wind energy forecasting analytics dashboard designed to help electricity procurement teams understand the difference between forecasted and actual wind generation. It analyses historical wind generation data for January 2026 using data from the Elexon BMRS API.

## Live Demo

- **Dashboard:** https://wind-analytics-7k2m-pi.vercel.app/
- **Backend API:** https://wind-analytics-7k2m.onrender.com
- **GitHub Repository:** https://github.com/Yashaswini-K-P/wind-analytics-7k2m

## Features

- **Forecast Accuracy Metrics:** Displays MAE, RMSE, forecast bias, and MAPE.
- **Actual vs Forecast Chart:** Compares actual wind generation with selected day-ahead forecasts.
- **Daily Error Analysis:** Highlights days with larger forecast errors.
- **Largest Forecast Errors:** Identifies hourly periods with the greatest differences between actual and forecast generation.
- **Forecast Direction Analysis:** Shows the proportion of hours with overforecasting and underforecasting.
- **Date Filtering:** Allows users to examine individual days.
- **Docker Support:** Provides containerized frontend and backend services.

## Technology Stack

**Frontend**
- React
- Vite
- Recharts
- CSS

**Backend**
- Python
- FastAPI
- Pandas
- NumPy
- Requests

**Data Source**
- Elexon BMRS API

**Deployment and Tools**
- Vercel for the frontend
- Render for the backend
- Docker and Docker Compose
- Git and GitHub

## Data and Methodology

The dashboard uses Elexon BMRS wind generation actuals and wind forecasts for January 1–31, 2026.

1. Retrieve actual wind generation records from the FUELHH dataset, filtering for `fuelType=WIND`.
2. Retrieve wind forecasts from the WINDFOR dataset.
3. Convert timestamps to UTC and restrict the evaluation to January 2026.
4. Aggregate half-hourly actual generation into hourly averages.
5. Select the latest forecast published by **12:00 UTC on the previous day** for each target hour.
6. Match forecast and actual generation by target hour.
7. Calculate forecast accuracy metrics and daily error summaries.

The 12:00 UTC previous-day cutoff is an evaluation assumption used for this project; it is not a cutoff specified by the assignment.

The final comparison contains 744 matched hourly records across 31 days.

## January 2026 Results

| Metric | Result |
|---|---:|
| Matched hours | 744 |
| Mean Absolute Error (MAE) | 2,017.92 MW |
| Root Mean Squared Error (RMSE) | 2,477.04 MW |
| Forecast Bias | +1,806.23 MW |
| Mean Absolute Percentage Error (MAPE) | 19.68% |
| Hours with overforecasting | 85.48% |
| Hours with underforecasting | 14.52% |

**Metric interpretation:** Positive forecast bias means forecast generation exceeded actual generation on average.

## Project Structure

```text
wind-forecast-dashboard/
├── backend/
│   ├── main.py
│   ├── analysis.py
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── notebooks/
│   └── wind_forecast_analysis.ipynb
├── .python-version
├── .gitignore
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Running Locally

### Prerequisites

- Python 3.12
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Yashaswini-K-P/wind-analytics-7k2m.git
cd wind-analytics-7k2m
```

### 2. Start the backend

Create and activate a Python virtual environment, then install the dependencies.

```bash
python -m venv .venv
```

On Windows Command Prompt:

```bat
.venv\Scripts\activate.bat
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn backend.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`.

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### 4. Run with Docker

From the project root, run:

```bash
docker compose up --build
```

Open `http://localhost:5173` to access the containerized application.

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Backend health message |
| `GET /api/actual-wind` | Actual wind generation records |
| `GET /api/wind-forecast` | Wind forecast records |
| `GET /api/metrics` | Summary accuracy metrics |
| `GET /api/comparison` | Hourly actual and forecast comparison |

## Limitations

- The analysis covers January 2026 only.
- The day-ahead forecast cutoff is an explicitly chosen project assumption.
- Forecast errors do not, by themselves, determine the optimal electricity procurement decision. Demand, market prices, other generation sources, and contract conditions would also be needed.
- The dashboard is an analytical prototype and does not execute trades or make automated procurement decisions.

## Future Improvements

- Support additional months and date ranges.
- Add forecast lead-time comparisons.
- Include electricity demand and market price data.
- Improve data caching and error handling.
- Add exportable reports and more detailed analysis.

## AI Usage Disclosure

AI assistance was used during development for guidance, troubleshooting, explanations, and implementation support. The project was tested through local execution, API checks, Docker, and deployment. The author should ensure that the final code and methodology are understood and can be explained independently.

## Data Source

Elexon BMRS API: https://data.elexon.co.uk/bmrs/api/v1/
