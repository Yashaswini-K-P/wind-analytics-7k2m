
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.analysis import build_comparison
import requests

app = FastAPI(title="Wind Energy Forecast Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
          "https://wind-analytics-7k2m-pi.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Wind Energy Forecast Dashboard API is running!"
    }


@app.get("/api/actual-wind")
def get_actual_wind():
    url = "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream"

    params = {
        "settlementDateFrom": "2026-01-01",
        "settlementDateTo": "2026-01-31",
        "fuelType": "WIND",
    }

    response = requests.get(url, params=params, timeout=60)
    response.raise_for_status()

    records = response.json()

    return {
        "period": "January 2026",
        "record_count": len(records),
        "sample_records": records[:5],
    }


@app.get("/api/wind-forecast")
def get_wind_forecast():
    url = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"

    params = {
        "publishDateTimeFrom": "2025-12-31T00:00:00Z",
        "publishDateTimeTo": "2026-02-01T00:00:00Z",
    }

    response = requests.get(url, params=params, timeout=60)
    response.raise_for_status()

    records = response.json()

    # Keep forecasts whose target times fall within January 2026.
    january_records = [
        record
        for record in records
        if "2026-01-01T00:00:00Z"
        <= record["startTime"]
        < "2026-02-01T00:00:00Z"
    ]

    return {
        "period": "January 2026",
        "total_records_received": len(records),
        "january_forecast_records": len(january_records),
        "sample_records": january_records[:5],
    }


@app.get("/api/metrics")
def get_metrics():
    metrics, comparison = build_comparison()
    return metrics


@app.get("/api/comparison")
def get_comparison():
    metrics, comparison = build_comparison()

    # Convert timestamps to strings so they can be sent as JSON.
    comparison["target_time"] = comparison["target_time"].dt.strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )

    return {
        "period": "January 2026",
        "matched_hours": len(comparison),
        "records": comparison.to_dict(orient="records"),
    }
