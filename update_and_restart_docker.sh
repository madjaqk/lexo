#!/bin/bash
set -euo pipefail

exec > >(tee >(logger -t update_and_restart_docker)) 2>&1

echo "### Starting deployment script ###"
echo "IMAGE_TAG: $IMAGE_TAG"
echo "ECR_BASE: $ECR_BASE"
echo "EC2_USER: $EC2_USER"
echo "S3_BUCKET: $S3_BUCKET"

cd /home/${EC2_USER}

aws s3 cp "s3://${S3_BUCKET}/docker-compose.prod.yaml" docker-compose.yaml

REPOS=("server" "frontend" "scheduler")

for REPO in "${REPOS[@]}"; do
    echo "=== Verifying $ECR_BASE/$REPO:latest points to $IMAGE_TAG ==="
    MAX_ATTEMPTS=12

    for ((i=1; i <= MAX_ATTEMPTS; i++)); do
        if docker manifest inspect "$ECR_BASE/$REPO:$IMAGE_TAG" > /dev/null 2>&1; then
            echo "✅ $ECR_BASE/$REPO: Image $IMAGE_TAG found via Docker Manifest API"

            SHA_DIGEST=$(docker manifest inspect "$ECR_BASE/$REPO:$IMAGE_TAG" | jq -r '.manifests[] | select(.platform.architecture != "unknown") | .digest')
            LATEST_DIGEST=$(docker manifest inspect "$ECR_BASE/$REPO:latest" | jq -r '.manifests[] | select(.platform.architecture != "unknown") | .digest')

            echo "Image SHA digest: $SHA_DIGEST"
            echo "Latest digest:    $LATEST_DIGEST"

            if [ "$SHA_DIGEST" = "$LATEST_DIGEST" ] && [ -n "$SHA_DIGEST" ] && [ "$SHA_DIGEST" != "null" ]; then
                echo "✅ $ECR_BASE/$REPO:latest points to $IMAGE_TAG"
                break
            else
                echo "⏳ Attempt $i/$MAX_ATTEMPTS: $ECR_BASE/$REPO: latest tag not yet updated"
            fi
        else
            echo "⏳ Attempt $i/$MAX_ATTEMPTS: $ECR_BASE/$REPO:$IMAGE_TAG not found via Docker Manifest API"
        fi

        if (( i == MAX_ATTEMPTS)); then
            echo "❌ $ECR_BASE/$REPO: Timed out waiting for latest to point to $IMAGE_TAG"
            exit 1
        fi

        sleep 15
    done
done

echo "=== All images verified, pull updates ==="

docker-compose pull --quiet
docker-compose up --force-recreate -d
echo "### Deployment script complete ###"
