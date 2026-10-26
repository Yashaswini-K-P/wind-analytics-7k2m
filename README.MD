# WindSight — Wind Energy Forecast Dashboard

WindSight is a wind generation analytics dashboard that compares day-ahead wind generation forecasts with actual UK wind generation for January 2026. It helps users evaluate forecast accuracy, identify systematic bias, and investigate periods with large forecast errors.

## Features

- KPI cards for Mean Absolute Error (MAE), Root Mean Square Error (RMSE), forecast bias, and Mean Absolute Percentage Error (MAPE).
- Interactive hourly chart comparing actual and forecast wind generation.
- Daily forecast-error chart.
- Filter the hourly chart by day.
- Table highlighting the five largest absolute forecast errors.
- Data coverage statistics and decision-support notes.
- Python API connected to the React dashboard.

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

**Data source**
- [Elexon Insights Solution API](https://data.elexon.co.uk/bmrs/api/v1/)

## Data and Methodology

The project uses UK wind generation data from Elexon's BMRS API.

- Actual generation is retrieved from the `FUELHH` dataset, filtered using `fuelType=WIND`.
- Forecasts are retrieved from the `WINDFOR` dataset.
- Half-hourly actual generation is aggregated into hourly averages.
- Forecasts are selected using a day-ahead cutoff assumption: the latest forecast published by 12:00 UTC on the day before the target date.
- Forecast and actual values are matched by target hour.
- The January 2026 evaluation contains 744 matched hourly records.

The 12:00 UTC cutoff is a project assumption for a consistent day-ahead evaluation. It is not claimed to be the official electricity-market procurement deadline.

## Key Results

Evaluation period: January 1–31, 2026.

| Metric | Result |
|---|---:|
| Matched hourly records | 744 |
| Mean Absolute Error (MAE) | 2,017.92 MW |
| Root Mean Square Error (RMSE) | 2,477.04 MW |
| Mean forecast bias | +1,806.23 MW |
| Mean Absolute Percentage Error (MAPE) | 19.68% |
| Hours with overforecasting | 85.48% |
| Hours with underforecasting | 14.52% |

A positive forecast bias indicates that forecasts were higher than actual generation on average in the evaluated period. These results describe this dataset and selection methodology; they should not be assumed to represent future performance.

## Project Structure

```text
wind-forecast-dashboard/
├── backend/
│   ├── main.py
│   └── analysis.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
├── notebooks/
│   └── wind_forecast_analysis.ipynb
├── README.md
└── .gitignore
```

## Run Locally

### Prerequisites

- Python 3.12
- Node.js and npm
- Internet connection to access the Elexon API

### 1. Start the backend

From the project root, activate your Python virtual environment in Windows Command Prompt:

```bat
.venv312\Scripts\activate.bat
```

Install the backend dependencies if needed:

```bat
python -m pip install fastapi uvicorn requests pandas numpy
```

Start the API:

```bat
python -m uvicorn backend.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`.

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Start the frontend

Open a second terminal:

```bat
cd frontend
npm install
npm run dev
```

Open the local address printed by Vite, usually `http://localhost:5173`.

Keep both terminals running while using the dashboard.

## API Endpoints

| Endpoint | Purpose |
|---|---|
| `/` | Backend status message |
| `/api/actual-wind` | Actual wind generation data |
| `/api/wind-forecast` | Wind forecast data |
| `/api/metrics` | Forecast accuracy metrics |
| `/api/comparison` | Matched hourly actual and forecast records |

## Limitations

- The analysis covers January 2026 only.
- The selected forecast cutoff is an explicit project assumption.
- Forecast errors do not by themselves establish the best electricity purchasing decision.
- Procurement decisions also depend on demand, market prices, other generation sources, contracts, and market rules.
- The dashboard depends on API availability and network access.

## AI Usage Disclosure

AI assistance was used during development for guidance, code suggestions, debugging support, and explanations of implementation steps. The project was built and tested iteratively, with the developer running the code and verifying the API and dashboard. Specific AI-assisted sections should be disclosed accurately in accordance with the hiring challenge instructions.

## Future Improvements

- Add date-range filtering.
- Add downloadable CSV reports.
- Improve API caching and error handling.
- Add Docker support and deploy the frontend and backend.
- Add automated tests for the data-processing pipeline.
