import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import re
import numpy as np

# --- CONFIGURATION ---
print("[STATUS] INITIALIZING")
# Standard GPT-2 (Base) for high-speed initialization (Few seconds)
MODEL_NAME = "gpt2" 
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
 
print(f"[STATUS] LOADING_WEIGHTS")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
model.to(DEVICE)
model.eval()
print("[STATUS] READY")
 
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

def preprocess_text(text: str) -> str:
    """
    CONSERVATIVE PRE-PROCESSOR: Removes decorative bullets without altering rhythm.
    We removed the aggressive period-adding and prose-joining logic because it 
    was 'smoothing' the AI's natural signature, reducing detection accuracy.
    This version only strips bullet markers while preserving original punctuation 
    and line breaks.
    """
    lines = text.split('\n')
    processed_lines = []
    
    for line in lines:
        # Only strip leading decorative bullets (-, *, •)
        # We keep numbers (1.) because they are often part of the neural flow.
        clean = re.sub(r'^[\-\*\•]\s*', '', line)
        processed_lines.append(clean)
        
    return "\n".join(processed_lines)

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
    NEURAL SIGMOID SCORING (v4.0)
    Implements a non-linear probability curve to match modern LLM benchmarks.
    This creates a much sharper distinction between 'Advanced AI' and 'Human' text.
    """
    import math

    # 1. Neural Predictability Sigmoid
    # Center Point (50% score) at PPL 100
    # Steepness factor: 25
    # For GPT-4 text (PPL ~80-120), this curve is very sensitive.
    ppl_score = 100 / (1 + math.exp((ppl - 100) / 25))
    
    # 2. Structural Monotony Sigmoid
    # Center Point (50% score) at Burst 0.4
    # Steepness factor: 0.1
    burst_score = 100 / (1 + math.exp((burst - 0.4) / 0.1))

    # 3. Hybrid Confidence Weighting
    # Predictability is the primary forensic marker (70% weight)
    base_prob = (ppl_score * 0.70) + (burst_score * 0.30)
    
    # 4. The 'Neural Signature' Synergy
    # If both markers point to AI, the probability accelerates toward 99%.
    final_prob = base_prob
    if ppl_score > 70 and burst_score > 70:
        final_prob = max(final_prob, 96.0)
    elif ppl_score > 50 and burst_score > 50:
        final_prob += 20

    # 5. Length Compensation
    if length > 300 and final_prob > 60:
        final_prob += 5

    # Clamp to 1-99.9
    final_prob = max(1, min(99.9, final_prob))
    
    classification = "Human"
    if final_prob > 80:
        classification = "Likely AI"
    elif final_prob > 45:
        classification = "Mixed / Neural-Assist"
        
    return {
        "probability": round(final_prob, 2),
        "classification": classification,
        "details": {
            "ppl_interpretation": "Neural Pattern" if ppl_score > 50 else "Natural Complexity",
            "burst_interpretation": "Robotic Monotony" if burst_score > 50 else "Human Rhythm",
            "ppl_score": round(ppl_score, 2),
            "burst_score": round(burst_score, 2)
        }
    }

@app.post("/detect", response_model=DetectionResponse)
async def detect_ai(request: DetectionRequest):
    text = request.text.strip()
    
    # PRE-PROCESSING: Re-thread fragmented structures for neural accuracy
    processed_text = preprocess_text(text)
    
    if not text:
        raise HTTPException(status_code=400, detail="Empty text provided")
    
    if len(text) < 20:
        raise HTTPException(status_code=400, detail="Text too short for analysis")

    try:
        # Use processed_text for neural analysis
        perplexity = calculate_perplexity(processed_text)
        # Use original text structure for burstiness (it relies on sentence length variance)
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
    # Industrial Port Migration: Shifting to 8008 to avoid collisions with common local services
    # Host changed to 127.0.0.1 to avoid unnecessary Windows Firewall prompts in production
    uvicorn.run(app, host="127.0.0.1", port=8008)