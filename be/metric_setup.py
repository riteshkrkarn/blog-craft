import os
from dotenv import load_dotenv
from metricai_sdk import MetricAIClient

load_dotenv(override=True)

metricai_api_key = os.environ.get("METRICAI_API_KEY")
firebase_token = os.environ.get("METRICAI_FIREBASE_TOKEN")

if firebase_token:
    metric_client = MetricAIClient(firebase_token=firebase_token, api_key=metricai_api_key)
else:
    metric_client = MetricAIClient(api_key=metricai_api_key)
