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
    NEURAL SCRUB (v2.0): Removes Markdown artifacts and structural noise.
    Neural analysis requires raw prose; markers like **bold** or ### headers 
    can skew perplexity and burstiness.
    """
    # 1. Strip Markdown Bold/Italic/Strikethrough
    text = re.sub(r'(\*\*|__|~~|\*|_)', '', text)
    
    # 2. Strip Markdown Headers (e.g., ### Title)
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    
    # 3. Strip Link Syntax [text](url) -> text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    
    # 4. Strip Blockquote Markers
    text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)
    
    # 5. Final line-by-line cleanup for bullet markers
    lines = text.split('\n')
    processed_lines = []
    for line in lines:
        clean = re.sub(r'^[\-\*\•]\s*', '', line)
        processed_lines.append(clean)
        
    return "\n".join(processed_lines)

def calculate_forensics(text: str) -> dict:
    """
    DEEP FORENSIC ANALYSIS (v6.0)
    Calculates Perplexity and Top-K distribution.
    INDUSTRIAL UPGRADE: We now analyze the probability distribution of every token 
    to see if it follows the 'stale' statistical pattern of neural generation.
    """
    encodings = tokenizer(text, return_tensors="pt", truncation=True, max_length=1024)
    input_ids = encodings.input_ids.to(DEVICE)
    
    if input_ids.size(1) < 10:
        return {"ppl": 0.0, "top_k_score": 0.0}

    with torch.no_grad():
        outputs = model(input_ids, labels=input_ids)
        logits = outputs.logits
        # Shift so that tokens < n predict n
        shift_logits = logits[..., :-1, :].contiguous()
        shift_labels = input_ids[..., 1:].contiguous()
        
        # Calculate cross entropy per token
        loss_fct = torch.nn.CrossEntropyLoss(reduction="none")
        token_loss = loss_fct(shift_logits.view(-1, shift_logits.size(-1)), shift_labels.view(-1))
        
        # Calculate Top-K hits (Forensic marker: How often the model 'guessed' the next word)
        # AI text stays in the Top-10 predictions ~90% of the time.
        _, top_10_indices = torch.topk(shift_logits, 10, dim=-1)
        top_10_hits = (shift_labels.unsqueeze(-1) == top_10_indices).any(dim=-1).float()
        top_k_score = top_10_hits.mean().item() * 100

        # Mean Perplexity
        ppl = torch.exp(token_loss.mean())

    return {
        "ppl": ppl.item(),
        "top_k_score": top_k_score
    }

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

def determine_classification(ppl: float, top_k: float, burst: float, length: int) -> dict:
    """
    NEURAL SIGMOID SCORING (v6.2) - High-Rigor AI Calibration
    Optimized for modern LLMs (Gemini, DeepSeek, GPT-4o).
    """
    import math

    # 1. Neural Predictability Sigmoid
    # Standard AI: low ppl. High-End AI: moderate ppl (for GPT-2).
    ppl_score = 100 / (1 + math.exp((ppl - 45) / 12))
    
    # 2. Top-K Profiling Sigmoid
    top_k_score = 100 / (1 + math.exp((72 - top_k) / 4))

    # 3. Structural Monotony Sigmoid (The strongest signal for High-End AI)
    # Modern AI is 'perfect' but monotonous.
    burst_score = 100 / (1 + math.exp((burst - 0.4) / 0.1))

    # 4. Multi-Marker Hybrid
    neural_base = (ppl_score * 0.5) + (top_k_score * 0.5)
    final_prob = (neural_base * 0.7) + (burst_score * 0.3)
    
    # 5. High-End AI Heuristic (The 'Genius AI' Profile)
    # If the text is monotonous (low burst) AND uses advanced vocabulary (ppl > 55)
    # AND maintains a neural top-k distribution (>65), it is almost certainly modern AI.
    if burst < 0.22 and ppl > 55 and top_k > 65:
        final_prob = max(final_prob, 88.0)
    elif burst < 0.25 and (ppl_score > 60 or top_k_score > 60):
        # Broaden synergy for mixed cases
        final_prob = max(final_prob, 72.0)

    # 6. Length & Confidence Adjustments
    if length > 200:
        if final_prob > 60: final_prob = min(99.9, final_prob + 8)
    elif length < 50:
        final_prob = (final_prob * 0.6) + 18

    # Clamp to 1-99.9
    final_prob = max(1, min(99.9, final_prob))
    
    classification = "Human"
    if final_prob > 75:
        classification = "Likely AI"
    elif final_prob > 35:
        classification = "Mixed / Neural-Assist"
        
    return {
        "probability": round(final_prob, 2),
        "classification": classification,
        "details": {
            "ppl_interpretation": "Neural Pattern" if ppl_score > 55 else "Natural Complexity",
            "top_k_interpretation": "Predictable Distribution" if top_k_score > 55 else "Organic Variation",
            "burst_interpretation": "Robotic Monotony" if burst_score > 55 else "Human Rhythm",
            "ppl_score": round(ppl_score, 2),
            "top_k_score": round(top_k_score, 2),
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
        # Use processed_text for deep neural analysis
        forensics = calculate_forensics(processed_text)
        perplexity = forensics["ppl"]
        top_k = forensics["top_k_score"]
        
        # Use original text structure for burstiness
        burstiness = calculate_burstiness(text)
        
        result = determine_classification(perplexity, top_k, burstiness, len(text.split()))
        
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