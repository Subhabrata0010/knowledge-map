# Knowledge Map Deployment Script (PowerShell)
# This script deploys the complete Knowledge Map infrastructure to AWS

param(
    [string]$Environment = "dev",
    [string]$AwsRegion = "us-east-1"
)

$ErrorActionPreference = "Stop"

# Configuration
$ProjectName = "knowledge-map"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BuildDir = Join-Path $RootDir "dist"
$CloudFormationDir = Join-Path $RootDir "cloudformation"

# Helper functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-ErrorMsg "AWS CLI is not installed. Please install it first."
        exit 1
    }
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-ErrorMsg "npm is not installed. Please install Node.js and npm first."
        exit 1
    }
    
    # Check AWS credentials
    try {
        aws sts get-caller-identity | Out-Null
    }
    catch {
        Write-ErrorMsg "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    }
    
    Write-Info "Prerequisites check passed ✓"
}

# Build Lambda functions
function Build-Lambda {
    Write-Info "Building Lambda functions..."
    
    Push-Location $RootDir
    
    try {
        # Install dependencies
        Write-Info "Installing dependencies..."
        npm ci --production=false
        
        # Compile TypeScript
        Write-Info "Compiling TypeScript..."
        npm run build
        
        # Install production dependencies
        Write-Info "Installing production dependencies..."
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        npm ci --production
        
        Write-Info "Lambda build completed ✓"
    }
    finally {
        Pop-Location
    }
}

# Package Lambda code
function New-LambdaPackage {
    Write-Info "Packaging Lambda code..."
    
    Push-Location $RootDir
    
    try {
        $PackageName = "$ProjectName-lambda-$Environment.zip"
        
        Write-Info "Creating deployment package: $PackageName"
        
        # Remove old package if exists
        if (Test-Path $PackageName) {
            Remove-Item $PackageName -Force
        }
        
        # Create zip package
        Compress-Archive -Path "dist\*", "node_modules\*" -DestinationPath $PackageName -CompressionLevel Optimal
        
        Write-Info "Lambda packaging completed ✓"
    }
    finally {
        Pop-Location
    }
}

# Upload to S3
function Publish-ToS3 {
    Write-Info "Uploading Lambda package to S3..."
    
    $BucketName = "$ProjectName-deployments-$AwsRegion"
    
    # Check if bucket exists
    $bucketExists = $false
    try {
        aws s3 ls "s3://$BucketName" 2>&1 | Out-Null
        $bucketExists = $LASTEXITCODE -eq 0
    }
    catch {
        $bucketExists = $false
    }
    
    if (-not $bucketExists) {
        Write-Info "Creating S3 bucket: $BucketName"
        if ($AwsRegion -eq "us-east-1") {
            aws s3 mb "s3://$BucketName"
        }
        else {
            aws s3 mb "s3://$BucketName" --region $AwsRegion
        }
    }
    
    # Upload Lambda package
    $PackageName = "$ProjectName-lambda-$Environment.zip"
    $S3Key = "$Environment/$PackageName"
    
    Write-Info "Uploading to s3://$BucketName/$S3Key"
    aws s3 cp "$RootDir\$PackageName" "s3://$BucketName/$S3Key"
    
    Write-Info "S3 upload completed ✓"
}

# Deploy CloudFormation stacks
function Deploy-CloudFormation {
    Write-Info "Deploying CloudFormation stacks..."
    
    $BucketName = "$ProjectName-deployments-$AwsRegion"
    $PackageName = "$ProjectName-lambda-$Environment.zip"
    $S3Key = "$Environment/$PackageName"
    
    # Deploy DynamoDB tables
    Write-Info "Deploying DynamoDB tables..."
    $DynamoDBStack = "$ProjectName-dynamodb-$Environment"
    aws cloudformation deploy `
        --template-file "$CloudFormationDir\dynamodb-tables.yaml" `
        --stack-name $DynamoDBStack `
        --parameter-overrides Environment=$Environment BillingMode=PAY_PER_REQUEST `
        --region $AwsRegion `
        --tags Environment=$Environment Application=$ProjectName `
        --no-fail-on-empty-changeset
    
    Write-Info "DynamoDB stack deployed ✓"
    
    # Deploy Lambda functions
    Write-Info "Deploying Lambda functions..."
    $LambdaStack = "$ProjectName-lambda-$Environment"
    aws cloudformation deploy `
        --template-file "$CloudFormationDir\lambda-functions.yaml" `
        --stack-name $LambdaStack `
        --parameter-overrides Environment=$Environment LambdaCodeBucket=$BucketName LambdaCodeKey=$S3Key DynamoDBStackName=$DynamoDBStack `
        --capabilities CAPABILITY_NAMED_IAM `
        --region $AwsRegion `
        --tags Environment=$Environment Application=$ProjectName `
        --no-fail-on-empty-changeset
    
    Write-Info "Lambda stack deployed ✓"
    
    # Deploy API Gateway
    Write-Info "Deploying API Gateway..."
    $ApiStack = "$ProjectName-api-$Environment"
    aws cloudformation deploy `
        --template-file "$CloudFormationDir\api-gateway.yaml" `
        --stack-name $ApiStack `
        --parameter-overrides Environment=$Environment LambdaStackName=$LambdaStack ApiKeysRequired=false `
        --region $AwsRegion `
        --tags Environment=$Environment Application=$ProjectName `
        --no-fail-on-empty-changeset
    
    Write-Info "API Gateway stack deployed ✓"
}

# Get stack outputs
function Get-StackOutputs {
    Write-Info "Retrieving stack outputs..."
    
    $ApiStack = "$ProjectName-api-$Environment"
    
    $ApiUrl = aws cloudformation describe-stacks `
        --stack-name $ApiStack `
        --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" `
        --output text `
        --region $AwsRegion
    
    Write-Host ""
    Write-Info "======================================"
    Write-Info "Deployment completed successfully! ✓"
    Write-Info "======================================"
    Write-Host ""
    Write-Info "API Gateway URL: $ApiUrl"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Info "1. Update your frontend .env file with: NEXT_PUBLIC_API_URL=$ApiUrl"
    Write-Info "2. Test the API: Invoke-RestMethod -Method Post -Uri '$ApiUrl/generate-map' -Body (@{topic='AI Agents'} | ConvertTo-Json) -ContentType 'application/json'"
    Write-Info "3. Monitor logs: aws logs tail /aws/lambda/$ProjectName-generate-$Environment --follow --region $AwsRegion"
    Write-Host ""
}

# Cleanup
function Remove-TempFiles {
    Write-Info "Cleaning up temporary files..."
    $PackageName = "$ProjectName-lambda-$Environment.zip"
    if (Test-Path "$RootDir\$PackageName") {
        Remove-Item "$RootDir\$PackageName" -Force
    }
    Write-Info "Cleanup completed ✓"
}

# Main execution
function Main {
    Write-Info "Starting deployment for environment: $Environment"
    Write-Info "AWS Region: $AwsRegion"
    Write-Host ""
    
    Test-Prerequisites
    Build-Lambda
    New-LambdaPackage
    Publish-ToS3
    Deploy-CloudFormation
    Get-StackOutputs
    Remove-TempFiles
    
    Write-Info "All done! 🚀"
}

# Run main
Main
