#!/bin/bash
set -euo pipefail

echo "### Starting EC2 deployment process ###"

# Generate docker-compose.prod.yaml from template
echo "=== Generating docker-compose.prod.yaml ==="
envsubst < docker-compose.prod.yaml.template > docker-compose.prod.yaml

# Generate update_and_restart_docker.sh from template
echo "=== Generating deployment script ==="
export ECR_BASE="${ECR_REPO_PREFIX}/${ECR_PROJECT_NAME}"
echo "+++++++++++++++++++++++++++++++++"
echo $(cat update_and_restart_docker.sh)
envsubst < update_and_restart_docker.sh > update_and_restart_docker.sh
echo $(cat update_and_restart_docker.sh)

# Upload both files to S3
echo "=== Uploading files to S3 ==="
aws s3 cp docker-compose.prod.yaml "s3://${S3_BUCKET}/docker-compose.prod.yaml"
aws s3 cp update_and_restart_docker.sh "s3://${S3_BUCKET}/update_and_restart_docker.sh"

# Execute deployment on EC2 via SSM
echo "=== Triggering deployment on EC2 ==="
COMMAND_ID=$(aws ssm send-command \
  --instance-ids "${EC2_INSTANCE_ID}" \
  --document-name "AWS-RunShellScript" \
  --comment "Deploy updated containers to EC2" \
  --parameters commands="\
      cd /home/${EC2_USER} && \
      aws s3 cp s3://${S3_BUCKET}/update_and_restart_docker.sh update_and_restart_docker.sh && \
      chmod +x update_and_restart_docker.sh && \
      ./update_and_restart_docker.sh" \
  --query 'Command.CommandId' \
  --output text \
)

echo "SSM command ID: $COMMAND_ID"

# Wait for command completion
echo "=== Waiting for deployment to complete ==="
aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$EC2_INSTANCE_ID" || true

# Check final status
STATUS=$(aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$EC2_INSTANCE_ID" \
  --query 'Status' \
  --output text)

echo "SSM command status: $STATUS"

# Show deployment logs
echo "=== Deployment output ==="
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$EC2_INSTANCE_ID" \
  --query '{stdout: StandardOutputContent, stderr: StandardErrorContent}' \
  --output json

if [ "$STATUS" != "Success" ]; then
  echo "❌ Deployment failed"
  exit 1
fi

echo "### ✅ Deployment completed successfully ###"
