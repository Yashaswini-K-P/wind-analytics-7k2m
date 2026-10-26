
import requests
import pandas as pd
import numpy as np


BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"


def build_comparison():
    # 1. Fetch actual wind generation
    actual_response = requests.get(
        f"{BASE_URL}/FUELHH/stream",
        params={
            "settlementDateFrom": "2026-01-01",
            "settlementDateTo": "2026-01-31",
            "fuelType": "WIND",
        },
        timeout=60,
    )
    actual_response.raise_for_status()
    actual_df = pd.DataFrame(actual_response.json())

    # 2. Fetch forecast records
    forecast_response = requests.get(
        f"{BASE_URL}/WINDFOR/stream",
        params={
            "publishDateTimeFrom": "2025-12-31T00:00:00Z",
            "publishDateTimeTo": "2026-02-01T00:00:00Z",
        },
        timeout=60,
    )
    forecast_response.raise_for_status()
    forecast_df = pd.DataFrame(forecast_response.json())

    # 3. Convert timestamps to UTC-aware datetime values
    actual_df["startTime"] = pd.to_datetime(
        actual_df["startTime"], utc=True
    )
    forecast_df["startTime"] = pd.to_datetime(
        forecast_df["startTime"], utc=True
    )
    forecast_df["publishTime"] = pd.to_datetime(
        forecast_df["publishTime"], utc=True
    )

    # 4. Keep forecasts targeting January 2026
    start = pd.Timestamp("2026-01-01T00:00:00Z")
    end = pd.Timestamp("2026-02-01T00:00:00Z")

    forecast_df = forecast_df[
        (forecast_df["startTime"] >= start)
        & (forecast_df["startTime"] < end)
    ].copy()

    # 5. Set the day-ahead cutoff: noon UTC on the previous day
    forecast_df["cutoff"] = (
        forecast_df["startTime"].dt.floor("D")
        - pd.Timedelta(days=1)
        + pd.Timedelta(hours=12)
    )

    eligible = forecast_df[
        forecast_df["publishTime"] <= forecast_df["cutoff"]
    ].copy()

    # Choose the latest eligible forecast for each target hour
    selected = (
        eligible.sort_values("publishTime")
        .drop_duplicates(subset=["startTime"], keep="last")
    )

    # 6. Average the two half-hour actual readings into hourly values
    actual_df["hour"] = actual_df["startTime"].dt.floor("h")

    actual_hourly = (
        actual_df.groupby("hour", as_index=False)["generation"]
        .mean()
        .rename(
            columns={
                "hour": "target_time",
                "generation": "actual_mw",
            }
        )
    )

    forecast_hourly = selected[
        ["startTime", "generation"]
    ].rename(
        columns={
            "startTime": "target_time",
            "generation": "forecast_mw",
        }
    )

    # 7. Match actuals and forecasts by target hour
    comparison = pd.merge(
        actual_hourly,
        forecast_hourly,
        on="target_time",
        how="inner",
        validate="one_to_one",
    ).sort_values("target_time").reset_index(drop=True)

    if comparison.empty:
        raise ValueError("No matching actual and forecast records found.")

    # 8. Calculate forecast errors
    comparison["error_mw"] = (
        comparison["forecast_mw"] - comparison["actual_mw"]
    )
    comparison["absolute_error_mw"] = comparison["error_mw"].abs()

    # 9. Calculate summary metrics
    actual = comparison["actual_mw"]
    forecast = comparison["forecast_mw"]
    error = comparison["error_mw"]

    nonzero_actual = actual != 0

    metrics = {
        "period": "January 2026",
        "matched_hours": int(len(comparison)),
        "days_analysed": int(comparison["target_time"].dt.date.nunique()),
        "mae_mw": round(float(error.abs().mean()), 2),
        "rmse_mw": round(float(np.sqrt((error ** 2).mean())), 2),
        "bias_mw": round(float(error.mean()), 2),
        "mape_percent": round(
            float(
                (error[nonzero_actual].abs()
                 / actual[nonzero_actual].abs()).mean() * 100
            ),
            2,
        ),
        "overforecast_percent": round(
            float((error > 0).mean() * 100), 2
        ),
        "underforecast_percent": round(
            float((error < 0).mean() * 100), 2
        ),
    }

    return metrics, comparison
