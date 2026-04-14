#!/usr/bin/env bash

ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null)
REGION="us-east-1"
TMPDIR_WORK=$(mktemp -d)

# --------------------------------------------------------------------------- #
# Step 1: Create the DevOps Agent Space role
# --------------------------------------------------------------------------- #

AGENT_SPACE_ROLE_NAME="DevOpsAgentRole-DefaultAgentSpace"

cat > "$TMPDIR_WORK/agentspace-trust-policy.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "aidevops.amazonaws.com"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "${ACCOUNT_ID}"
        },
        "ArnLike": {
          "aws:SourceArn": "arn:aws:aidevops:${REGION}:${ACCOUNT_ID}:agentspace/*"
        }
      }
    }
  ]
}
EOF

AGENT_SPACE_ROLE_ARN=$(aws iam create-role \
    --role-name "$AGENT_SPACE_ROLE_NAME" \
    --assume-role-policy-document "file://$TMPDIR_WORK/agentspace-trust-policy.json" \
    --query 'Role.Arn' \
    --output text)

aws iam attach-role-policy \
    --role-name "$AGENT_SPACE_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AIDevOpsAgentAccessPolicy"

cat > "$TMPDIR_WORK/agentspace-inline-policy.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCreateServiceLinkedRoles",
      "Effect": "Allow",
      "Action": [
        "iam:CreateServiceLinkedRole"
      ],
      "Resource": [
        "arn:aws:iam::${ACCOUNT_ID}:role/aws-service-role/resource-explorer-2.amazonaws.com/AWSServiceRoleForResourceExplorer"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
    --role-name "$AGENT_SPACE_ROLE_NAME" \
    --policy-name "AllowCreateServiceLinkedRoles" \
    --policy-document "file://$TMPDIR_WORK/agentspace-inline-policy.json"

# --------------------------------------------------------------------------- #
# Step 2: Create the DevOps Agent Operator App role
# --------------------------------------------------------------------------- #

OPERATOR_ROLE_NAME="DevOpsAgentRole-OperatorApp"

cat > "$TMPDIR_WORK/operator-trust-policy.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "aidevops.amazonaws.com"
      },
      "Action": [
        "sts:AssumeRole",
        "sts:TagSession"
      ],
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "${ACCOUNT_ID}"
        },
        "ArnLike": {
          "aws:SourceArn": "arn:aws:aidevops:${REGION}:${ACCOUNT_ID}:agentspace/*"
        }
      }
    }
  ]
}
EOF

OPERATOR_ROLE_ARN=$(aws iam create-role \
    --role-name "$OPERATOR_ROLE_NAME" \
    --assume-role-policy-document "file://$TMPDIR_WORK/operator-trust-policy.json" \
    --query 'Role.Arn' \
    --output text)

aws iam attach-role-policy \
    --role-name "$OPERATOR_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AIDevOpsOperatorAppAccessPolicy"

# --------------------------------------------------------------------------- #
# Step 3: Wait for IAM propagation
# --------------------------------------------------------------------------- #

sleep 10

# --------------------------------------------------------------------------- #
# Step 4: Create the DevOps Agent Space
# --------------------------------------------------------------------------- #

AGENT_SPACE_NAME="Default Agent Space"
AGENT_SPACE_DESC="Agent Space for this AWS Account"

AGENT_SPACE_ID=$(aws devops-agent create-agent-space \
    --name "$AGENT_SPACE_NAME" \
    --description "$AGENT_SPACE_DESC" \
    --region "$REGION" \
    --query 'agentSpace.agentSpaceId' \
    --output text)

# --------------------------------------------------------------------------- #
# Step 5: Associate the primary AWS account
# --------------------------------------------------------------------------- #

PRIMARY_AWS_ACCOUNT_CONFIG=$(cat <<EOF
{
  "aws": {
    "assumableRoleArn": "${AGENT_SPACE_ROLE_ARN}",
    "accountId": "${ACCOUNT_ID}",
    "accountType": "monitor"
  }
}
EOF
)

aws devops-agent associate-service \
    --agent-space-id "$AGENT_SPACE_ID" \
    --service-id aws \
    --configuration "$PRIMARY_AWS_ACCOUNT_CONFIG" \
    --region "$REGION"

# --------------------------------------------------------------------------- #
# Step 6: Enable the Operator App
# --------------------------------------------------------------------------- #

aws devops-agent enable-operator-app \
    --agent-space-id "$AGENT_SPACE_ID" \
    --auth-flow iam \
    --operator-app-role-arn "$OPERATOR_ROLE_ARN" \
    --region "$REGION"

# --------------------------------------------------------------------------- #
# Step 7: Verification
# --------------------------------------------------------------------------- #

aws devops-agent get-agent-space \
    --agent-space-id "$AGENT_SPACE_ID" \
    --region "$REGION" \
    --output table 2>/dev/null

aws devops-agent list-associations \
    --agent-space-id "$AGENT_SPACE_ID" \
    --region "$REGION" \
    --output table 2>/dev/null
