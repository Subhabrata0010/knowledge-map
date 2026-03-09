#!/bin/bash

# Script to run DynamoDB Local with Docker for development

set -e

# Configuration
CONTAINER_NAME="dynamodb-local"
DOCKER_IMAGE="amazon/dynamodb-local:latest"
PORT=8000
DATA_DIR="$(pwd)/.dynamodb-local-data"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
}

# Stop and remove existing container
stop_container() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "Stopping existing container..."
        docker stop "$CONTAINER_NAME" > /dev/null 2>&1 || true
        docker rm "$CONTAINER_NAME" > /dev/null 2>&1 || true
    fi
}

# Start DynamoDB Local
start_dynamodb() {
    log_info "Starting DynamoDB Local..."
    
    # Create data directory if it doesn't exist
    mkdir -p "$DATA_DIR"
    
    # Pull latest image
    log_info "Pulling Docker image..."
    docker pull "$DOCKER_IMAGE"
    
    # Start container
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "${PORT}:8000" \
        -v "${DATA_DIR}:/data" \
        "$DOCKER_IMAGE" \
        -jar DynamoDBLocal.jar \
        -sharedDb \
        -dbPath /data
    
    log_info "DynamoDB Local started successfully!"
    log_info "Endpoint: http://localhost:${PORT}"
    log_info "Data directory: $DATA_DIR"
}

# Create tables
create_tables() {
    log_info "Creating DynamoDB tables..."
    
    # Wait for DynamoDB to be ready
    sleep 2
    
    # Nodes table
    log_info "Creating nodes table..."
    aws dynamodb create-table \
        --table-name knowledge-map-nodes-dev \
        --attribute-definitions \
            AttributeName=pk,AttributeType=S \
            AttributeName=sk,AttributeType=S \
            AttributeName=nodeType,AttributeType=S \
            AttributeName=importance,AttributeType=N \
        --key-schema \
            AttributeName=pk,KeyType=HASH \
            AttributeName=sk,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --global-secondary-indexes \
            "[{\"IndexName\":\"NodeTypeIndex\",\"KeySchema\":[{\"AttributeName\":\"pk\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"nodeType\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"ImportanceIndex\",\"KeySchema\":[{\"AttributeName\":\"pk\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"importance\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
        --endpoint-url http://localhost:${PORT} \
        --region us-east-1 \
        > /dev/null
    
    # Edges table
    log_info "Creating edges table..."
    aws dynamodb create-table \
        --table-name knowledge-map-edges-dev \
        --attribute-definitions \
            AttributeName=pk,AttributeType=S \
            AttributeName=sk,AttributeType=S \
            AttributeName=relationType,AttributeType=S \
            AttributeName=weight,AttributeType=N \
        --key-schema \
            AttributeName=pk,KeyType=HASH \
            AttributeName=sk,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --global-secondary-indexes \
            "[{\"IndexName\":\"RelationTypeIndex\",\"KeySchema\":[{\"AttributeName\":\"pk\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"relationType\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"WeightIndex\",\"KeySchema\":[{\"AttributeName\":\"pk\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"weight\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
        --endpoint-url http://localhost:${PORT} \
        --region us-east-1 \
        > /dev/null
    
    # Cache table
    log_info "Creating cache table..."
    aws dynamodb create-table \
        --table-name knowledge-map-cache-dev \
        --attribute-definitions \
            AttributeName=pk,AttributeType=S \
            AttributeName=sk,AttributeType=S \
        --key-schema \
            AttributeName=pk,KeyType=HASH \
            AttributeName=sk,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url http://localhost:${PORT} \
        --region us-east-1 \
        > /dev/null
    
    log_info "Tables created successfully!"
}

# List tables
list_tables() {
    log_info "Listing tables..."
    aws dynamodb list-tables \
        --endpoint-url http://localhost:${PORT} \
        --region us-east-1 \
        --output table
}

# Show status
show_status() {
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "DynamoDB Local is running"
        log_info "Container: $CONTAINER_NAME"
        log_info "Endpoint: http://localhost:${PORT}"
        log_info "Data directory: $DATA_DIR"
        echo ""
        list_tables
    else
        log_warn "DynamoDB Local is not running"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "DynamoDB Local Manager"
    echo "======================"
    echo "1. Start DynamoDB Local"
    echo "2. Stop DynamoDB Local"
    echo "3. Restart DynamoDB Local"
    echo "4. Create tables"
    echo "5. List tables"
    echo "6. Show status"
    echo "7. View logs"
    echo "8. Exit"
    echo ""
}

# Handle command
handle_command() {
    case $1 in
        1|start)
            check_docker
            stop_container
            start_dynamodb
            show_status
            ;;
        2|stop)
            stop_container
            log_info "DynamoDB Local stopped"
            ;;
        3|restart)
            check_docker
            stop_container
            start_dynamodb
            show_status
            ;;
        4|create-tables)
            create_tables
            list_tables
            ;;
        5|list-tables)
            list_tables
            ;;
        6|status)
            show_status
            ;;
        7|logs)
            docker logs -f "$CONTAINER_NAME"
            ;;
        8|exit)
            log_info "Exiting..."
            exit 0
            ;;
        *)
            log_error "Invalid option"
            ;;
    esac
}

# Main execution
if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        read -p "Select an option: " choice
        handle_command "$choice"
        echo ""
        read -p "Press Enter to continue..."
    done
else
    # Command-line mode
    handle_command "$1"
fi
