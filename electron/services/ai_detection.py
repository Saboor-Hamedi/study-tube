import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import re
import numpy as np

# --- CONFIGURATION ---
# UPGRADE: Using gpt2-large for better sensitivity to modern AI patterns.
# It is larger (3GB RAM) but much more accurate than base gpt2.
MODEL_NAME = "gpt2-large" 
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Loading {MODEL_NAME} on {DEVICE}... This may take a minute.")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
model.to(DEVICE)
model.eval()
print("Model loaded successfully.")

app = FastAPI(title="AI Detection Engine v2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DetectionRequest(BaseModel):
    text: str

class DetectionResponse(BaseModel):
    ai_probability: float
    perplexity: float
    burstiness: float
    classification: str
    details: dict

def calculate_perplexity(text: str) -> float:
    """
    Calculates perplexity using a fixed-window approach optimized for speed.
    INDUSTRIAL OPTIMIZATION: We cap analysis at 1024 tokens (~700-800 words).
    Processing more than 1024 tokens on CPU is computationally expensive
    and rarely changes the statistical signature of the neural origin.
    """
    # Use truncation to ensure we only process the first 1024 tokens
    encodings = tokenizer(text, return_tensors="pt", truncation=True, max_length=1024)
    input_ids = encodings.input_ids.to(DEVICE)
    
    if input_ids.size(1) < 10:
        return 0.0

    target_ids = input_ids.clone()
    
    with torch.no_grad():
        outputs = model(input_ids, labels=target_ids)
        # Average negative log-likelihood
        neg_log_likelihood = outputs.loss

    ppl = torch.exp(neg_log_likelihood)
    return ppl.item()

def calculate_burstiness(text: str) -> float:
    """
    Calculates burstiness using Coefficient of Variation (CV).
    """
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s for s in sentences if len(s.strip()) > 0]
    
    if len(sentences) < 2:
        return 0.0
        
    lengths = [len(s.split()) for s in sentences]
    std_dev = np.std(lengths)
    mean_len = np.mean(lengths)
    
    if mean_len == 0:
        return 0.0
        
    return std_dev / mean_len

def determine_classification(ppl: float, burst: float, length: int) -> dict:
    """
    RECALIBRATED for high-density neural detection.
    Modern AI text (GPT-4/Claude) often generates perplexity in the 25-55 range.
    We are increasing weights to align with professional scanners (GPTZero).
    """
    score = 0.0
    details = {
        "ppl_interpretation": "",
        "burst_interpretation": ""
    }

    # 1. Perplexity Analysis (Aggressive Scoring)
    if ppl < 30:
        score += 75
        details["ppl_interpretation"] = "Neural Pattern Detected (High Certainty)"
    elif ppl < 55:
        score += 55
        details["ppl_interpretation"] = "Highly Predictable Structure"
    elif ppl < 85:
        score += 25
        details["ppl_interpretation"] = "Moderate Complexity"
    else:
        score -= 20
        details["ppl_interpretation"] = "Human-like Complexity"

    # 2. Burstiness Analysis (Variance in Sentence Length)
    if burst < 0.25:
        score += 20
        details["burst_interpretation"] = "Low Structural Variance"
    elif burst < 0.45:
        score += 10
        details["burst_interpretation"] = "Standard Academic Flow"
    else:
        score -= 15
        details["burst_interpretation"] = "High Linguistic Variance"

    # 3. Synergy & Length Bonus
    if ppl < 50 and burst < 0.35:
        score += 15 # Strong signal overlap

    # 4. Short Text Penalty Mitigation
    # If text is short, we rely more on PPL than Burstiness
    if length < 50:
        score = min(score, 70) if ppl > 40 else score
        details["warning"] = "Limited sample size"

    # Clamp between 1 and 99
    final_prob = max(1, min(99, score))
    
    classification = "Human"
    if final_prob > 70:
        classification = "Likely AI"
    elif final_prob > 35:
        classification = "Mixed / Neural-Assist"
        
    return {
        "probability": final_prob,
        "classification": classification,
        "details": details
    }

@app.post("/detect", response_model=DetectionResponse)
async def detect_ai(request: DetectionRequest):
    text = request.text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Empty text provided")
    
    if len(text) < 20:
        raise HTTPException(status_code=400, detail="Text too short for analysis")

    try:
        perplexity = calculate_perplexity(text)
        burstiness = calculate_burstiness(text)
        
        result = determine_classification(perplexity, burstiness, len(text.split()))
        
        return DetectionResponse(
            ai_probability=result["probability"],
            perplexity=round(perplexity, 2),
            burstiness=round(burstiness, 2),
            classification=result["classification"],
            details=result["details"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)