from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.trust_engine import evaluate_all_metrics

router = APIRouter(prefix="/analysis", tags=["analysis"])

class AnalysisRequest(BaseModel):
    prompt: str
    response: str
    context: Optional[str] = None
    sources: Optional[List[str]] = None
    samples: Optional[List[str]] = None

@router.post("/metrics")
def calculate_metrics_endpoint(payload: AnalysisRequest) -> Dict[str, Any]:
    return evaluate_all_metrics(
        prompt=payload.prompt,
        response=payload.response,
        context=payload.context,
        sources=payload.sources,
        samples=payload.samples
    )

@router.get("/metrics/default")
def get_default_metrics():
    return {
        "cumulative_trust_score": 74,
        "metrics": [
            { "label": "Self-consistency", "description": "Consistency across sampled response paths", "weight": 25, "value": 84 },
            { "label": "Semantic agreement", "description": "Alignment with vector database embeddings", "weight": 25, "value": 71 },
            { "label": "Source quality", "description": "Fidelity index of retrieved references", "weight": 20, "value": 65 },
            { "label": "Retrieval completeness", "description": "Context coverage across prompt constraints", "weight": 15, "value": 88 },
            { "label": "External verification", "description": "Cross-validation against ground truth facts", "weight": 15, "value": 59 }
        ]
    }
