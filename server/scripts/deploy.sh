#!/bin/bash

# Knowledge Map Deployment Script
# This script deploys the complete Knowledge Map infrastructure to AWS

set -e  # Exit on error

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}
PROJECT_NAME="knowledge-map"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$ROOT_DIR/dist"
CLOUDFORMATION_DIR="$ROOT_DIR/cloudformation"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
}

# Build Lambda functions
build_lambda() {
    log_info "Building Lambda functions..."
    
    cd "$ROOT_DIR"
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Compile TypeScript
    log_info "Compiling TypeScript..."
    npm run build
    
    # Install production dependencies
    log_info "Installing production dependencies..."
    rm -rf node_modules
    npm ci --production
    
    log_info "Lambda build completed ✓"
}

# Package Lambda code
package_lambda() {
    log_info "Packaging Lambda code..."
    
    cd "$ROOT_DIR"
    
    # Create deployment package
    PACKAGE_NAME="${PROJECT_NAME}-lambda-${ENVIRONMENT}.zip"
    
    log_info "Creating deployment package: $PACKAGE_NAME"
    zip -r "$PACKAGE_NAME" dist/ node_modules/ -x "*.test.js" "*.spec.js" "*/test/*" "*/tests/*"
    
    log_info "Lambda packaging completed ✓"
}

# Upload to S3
upload_to_s3() {
    log_info "Uploading Lambda package to S3..."
    
    # Create S3 bucket if it doesn't exist
    BUCKET_NAME="${PROJECT_NAME}-deployments-${AWS_REGION}"
    
    if ! aws s3 ls "s3://${BUCKET_NAME}" 2>&1 > /dev/null; then
        log_info "Creating S3 bucket: $BUCKET_NAME"
        if [ "$AWS_REGION" == "us-east-1" ]; then
            aws s3 mb "s3://${BUCKET_NAME}"
        else
            aws s3 mb "s3://${BUCKET_NAME}" --region "$AWS_REGION"
        fi
    fi
    
    # Upload Lambda package
    PACKAGE_NAME="${PROJECT_NAME}-lambda-${ENVIRONMENT}.zip"
    S3_KEY="${ENVIRONMENT}/${PACKAGE_NAME}"
    
    log_info "Uploading to s3://${BUCKET_NAME}/${S3_KEY}"
    aws s3 cp "$ROOT_DIR/$PACKAGE_NAME" "s3://${BUCKET_NAME}/${S3_KEY}"
    
    log_info "S3 upload completed ✓"
}

# Deploy CloudFormation stacks
deploy_cloudformation() {
    log_info "Deploying CloudFormation stacks..."
    
    BUCKET_NAME="${PROJECT_NAME}-deployments-${AWS_REGION}"
    PACKAGE_NAME="${PROJECT_NAME}-lambda-${ENVIRONMENT}.zip"
    S3_KEY="${ENVIRONMENT}/${PACKAGE_NAME}"
    
    # Deploy DynamoDB tables
    log_info "Deploying DynamoDB tables..."
    DYNAMODB_STACK="${PROJECT_NAME}-dynamodb-${ENVIRONMENT}"
    aws cloudformation deploy \
        --template-file "$CLOUDFORMATION_DIR/dynamodb-tables.yaml" \
        --stack-name "$DYNAMODB_STACK" \
        --parameter-overrides \
            Environment="$ENVIRONMENT" \
            BillingMode=PAY_PER_REQUEST \
        --region "$AWS_REGION" \
        --tags Environment="$ENVIRONMENT" Application="$PROJECT_NAME" \
        --no-fail-on-empty-changeset
    
    log_info "DynamoDB stack deployed ✓"
    
    # Deploy Lambda functions
    log_info "Deploying Lambda functions..."
    LAMBDA_STACK="${PROJECT_NAME}-lambda-${ENVIRONMENT}"
    aws cloudformation deploy \
        --template-file "$CLOUDFORMATION_DIR/lambda-functions.yaml" \
        --stack-name "$LAMBDA_STACK" \
        --parameter-overrides \
            Environment="$ENVIRONMENT" \
            LambdaCodeBucket="$BUCKET_NAME" \
            LambdaCodeKey="$S3_KEY" \
            DynamoDBStackName="$DYNAMODB_STACK" \
        --capabilities CAPABILITY_NAMED_IAM \
        --region "$AWS_REGION" \
        --tags Environment="$ENVIRONMENT" Application="$PROJECT_NAME" \
        --no-fail-on-empty-changeset
    
    log_info "Lambda stack deployed ✓"
    
    # Deploy API Gateway
    log_info "Deploying API Gateway..."
    API_STACK="${PROJECT_NAME}-api-${ENVIRONMENT}"
    aws cloudformation deploy \
        --template-file "$CLOUDFORMATION_DIR/api-gateway.yaml" \
        --stack-name "$API_STACK" \
        --parameter-overrides \
            Environment="$ENVIRONMENT" \
            LambdaStackName="$LAMBDA_STACK" \
            ApiKeysRequired=false \
        --region "$AWS_REGION" \
        --tags Environment="$ENVIRONMENT" Application="$PROJECT_NAME" \
        --no-fail-on-empty-changeset
    
    log_info "API Gateway stack deployed ✓"
}

# Get stack outputs
get_outputs() {
    log_info "Retrieving stack outputs..."
    
    API_STACK="${PROJECT_NAME}-api-${ENVIRONMENT}"
    
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name "$API_STACK" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
        --output text \
        --region "$AWS_REGION")
    
    echo ""
    log_info "======================================"
    log_info "Deployment completed successfully! ✓"
    log_info "======================================"
    echo ""
    log_info "API Gateway URL: $API_URL"
    echo ""
    log_info "Next steps:"
    log_info "1. Update your frontend .env file with: NEXT_PUBLIC_API_URL=$API_URL"
    log_info "2. Test the API: curl -X POST $API_URL/generate-map -H 'Content-Type: application/json' -d '{\"topic\":\"AI Agents\"}'"
    log_info "3. Monitor logs: aws logs tail /aws/lambda/${PROJECT_NAME}-generate-${ENVIRONMENT} --follow --region $AWS_REGION"
    echo ""
}

# Cleanup
cleanup() {
    log_info "Cleaning up temporary files..."
    cd "$ROOT_DIR"
    rm -f "${PROJECT_NAME}-lambda-${ENVIRONMENT}.zip"
    log_info "Cleanup completed ✓"
}

# Main execution
main() {
    log_info "Starting deployment for environment: $ENVIRONMENT"
    log_info "AWS Region: $AWS_REGION"
    echo ""
    
    check_prerequisites
    build_lambda
    package_lambda
    upload_to_s3
    deploy_cloudformation
    get_outputs
    cleanup
    
    log_info "All done! 🚀"
}

# Run main
main
