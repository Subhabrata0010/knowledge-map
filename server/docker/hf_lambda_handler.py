"""
Lambda handler for HuggingFace model inference
Runs TinyLlama 1.1B model locally in Lambda
"""

import json
import os
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Load model once (Lambda container reuse)
MODEL_PATH = os.environ.get("HF_MODEL_PATH", "/opt/ml/model")
print(f"Loading model from {MODEL_PATH}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH)
model.eval()
print("Model loaded successfully!")


def handler(event, context):
    """
    Lambda handler for HuggingFace inference
    
    Event format:
    {
      "inputs": "prompt text",
      "parameters": {
        "max_new_tokens": 2048,
        "temperature": 0.3
      }
    }
    """
    try:
        # Parse request
        body = json.loads(event.get("body", event))
        inputs = body.get("inputs", "")
        parameters = body.get("parameters", {})
        
        max_new_tokens = parameters.get("max_new_tokens", 1024)
        temperature = parameters.get("temperature", 0.7)
        
        # Tokenize
        input_ids = tokenizer(inputs, return_tensors="pt").input_ids
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(
                input_ids,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id,
            )
        
        # Decode
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove input from output
        if generated_text.startswith(inputs):
            generated_text = generated_text[len(inputs):].strip()
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "generated_text": generated_text
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            })
        }
