"""
Deploy HuggingFace model to AWS SageMaker
Model: Llama-3.2-3B-Instruct (FREE, fast, good quality)
"""

import boto3
import sagemaker
from sagemaker.huggingface import HuggingFaceModel

# Configuration
MODEL_NAME = "meta-llama/Llama-3.2-3B-Instruct"  # Or Mistral-7B, Phi-3, TinyLlama
INSTANCE_TYPE = "ml.g4dn.xlarge"  # GPU instance (~$0.70/hr, or use spot for $0.21/hr)
ENDPOINT_NAME = "knowledge-map-llama"

# Initialize SageMaker session
role = sagemaker.get_execution_role()  # Or your IAM role ARN
sess = sagemaker.Session()

# Create HuggingFace Model
huggingface_model = HuggingFaceModel(
    model_data=f"s3://sagemaker-huggingface-models/{MODEL_NAME}",  # Or load from HF Hub
    transformers_version="4.37.0",
    pytorch_version="2.1.0",
    py_version="py310",
    role=role,
    env={
        "HF_MODEL_ID": MODEL_NAME,
        "HF_TASK": "text-generation",
        "MAX_BATCH_SIZE": "4",
        "MAX_INPUT_LENGTH": "2048",
        "MAX_TOTAL_TOKENS": "4096",
    }
)

# Deploy to endpoint
print(f"Deploying {MODEL_NAME} to SageMaker...")
predictor = huggingface_model.deploy(
    initial_instance_count=1,
    instance_type=INSTANCE_TYPE,
    endpoint_name=ENDPOINT_NAME,
    
    # Auto-scaling configuration (optional)
    # Will scale down to 0 when not in use (save costs!)
    auto_scale={
        "min_capacity": 0,  # Scale to zero when idle
        "max_capacity": 2,
        "target_value": 70.0,
        "scale_in_cooldown": 600,  # 10 min cooldown
        "scale_out_cooldown": 60,
    }
)

print(f"\n✅ Model deployed successfully!")
print(f"Endpoint: {predictor.endpoint_name}")
print(f"URL: https://runtime.sagemaker.{boto3.Session().region_name}.amazonaws.com/endpoints/{ENDPOINT_NAME}/invocations")
print(f"\nAdd to .env:")
print(f"USE_HF_MODEL=true")
print(f"HF_ENDPOINT_URL=https://runtime.sagemaker.{boto3.Session().region_name}.amazonaws.com/endpoints/{ENDPOINT_NAME}/invocations")
print(f"HF_MODEL_NAME={MODEL_NAME}")

# Test the endpoint
print("\nTesting endpoint...")
test_input = {
    "inputs": "Extract entities from: JavaScript is a programming language used with React framework",
    "parameters": {
        "max_new_tokens": 200,
        "temperature": 0.3,
    }
}

response = predictor.predict(test_input)
print(f"Response: {response}")
