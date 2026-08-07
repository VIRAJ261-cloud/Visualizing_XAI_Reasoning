from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.security import hash_password
from app.routes.chat import router as chat_router

app = FastAPI(
    title="XAI",
    description="Visualizing reasoning behind the model predictions",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")

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
