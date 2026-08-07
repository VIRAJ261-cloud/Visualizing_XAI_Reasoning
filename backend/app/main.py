from fastapi import FastAPI

app = FastAPI(
    title="XAI",
    description="Visualizing reasoning behind the model predictions",
    version="0.1.0",
)

@app.get('/health')
def working():
    return {
        "status": "ok",
        "message": "The API is running successfully."
        }

