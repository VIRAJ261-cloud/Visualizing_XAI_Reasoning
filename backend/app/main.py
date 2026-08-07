from fastapi import FastAPI
from app.core.security import hash_password

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

@app.get("/security-test")
def security_test():

    password = "test123"

    return {
        "hashed": hash_password(password)
    }
