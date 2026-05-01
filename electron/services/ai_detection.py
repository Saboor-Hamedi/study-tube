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
    Calculates perplexity using a sliding window.
    Note: GPT-2-Large has a context window of 1024 tokens.
    """
    encodings = tokenizer(text, return_tensors="pt")
    max_length = model.config.n_positions # 1024
    stride = 512
    
    nlls = []
    prev_end_loc = 0
    input_ids_full = encodings.input_ids.to(DEVICE)
    
    # Process in chunks to avoid OOM on long texts
    for begin_loc in range(0, input_ids_full.size(1), stride):
        end_loc = min(begin_loc + max_length, input_ids_full.size(1))
        trg_len = end_loc - prev_end_loc
        
        input_ids = input_ids_full[:, begin_loc:end_loc]
        target_ids = input_ids.clone()
        target_ids[:, :-trg_len] = -100 

        with torch.no_grad():
            outputs = model(input_ids, labels=target_ids)
            neg_log_likelihood = outputs.loss

        nlls.append(neg_log_likelihood)
        prev_end_loc = end_loc
        
        if end_loc == input_ids_full.size(1):
            break

    if not nlls:
        return 0.0
        
    ppl = torch.exp(torch.stack(nlls).mean())
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
    RECALIBRATED for GPT-4 / Claude 3 / Gemini.
    Modern AI has higher perplexity than old AI, so we lowered the thresholds.
    """
    score = 0.0
    details = {
        "ppl_interpretation": "",
        "burst_interpretation": ""
    }

    # 1. Perplexity Analysis (Recalibrated for GPT-2-Large)
    # GPT-4 text often falls in the 20-50 range when measured by GPT-2-Large.
    if ppl < 25:
        score += 60
        details["ppl_interpretation"] = "Highly Predictable (Strong AI Signal)"
    elif ppl < 45:
        score += 40
        details["ppl_interpretation"] = "Moderately Predictable (Likely AI)"
    elif ppl < 70:
        score += 15
        details["ppl_interpretation"] = "Complex (Could be Human or Advanced AI)"
    else:
        score -= 10
        details["ppl_interpretation"] = "Highly Complex (Human-like)"

    # 2. Burstiness Analysis
    # Modern AI (especially Claude) can have higher burstiness than GPT-3.
    if burst < 0.2:
        score += 30
        details["burst_interpretation"] = "Robotic Uniformity"
    elif burst < 0.35:
        score += 15
        details["burst_interpretation"] = "Low Variance"
    else:
        score -= 10
        details["burst_interpretation"] = "Natural Variation"

    # 3. Synergy Bonus
    # If BOTH metrics point to AI, we boost confidence significantly.
    if ppl < 45 and burst < 0.3:
        score += 10 

    # 4. Length Adjustment
    if length < 50:
        score = min(score, 50) # Cap confidence for short text
        details["warning"] = "Short text: results are less reliable"

    # Clamp between 5 and 99
    final_prob = max(5, min(99, score))
    
    classification = "Human"
    if final_prob > 75:
        classification = "Likely AI"
    elif final_prob > 45:
        classification = "Uncertain/Mixed"
        
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