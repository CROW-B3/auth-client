#!/bin/bash
#
# Complete Onboarding Flow E2E Test
# Tests the full onboarding flow via direct API calls
#
# Usage: ./onboarding_flow_test.sh [email]
#
# If email is not provided, generates a unique test email

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BASE_URL="${API_BASE_URL:-https://dev.api.crowai.dev}"
AUTH_PATH="/api/v1/auth"
ORIGIN="${API_ORIGIN:-https://dev.auth.crowai.dev}"
COOKIES="cookies_$$.txt"
TIMESTAMP=$(date +%s)

# Use provided email or generate one
if [ -n "$1" ]; then
  EMAIL="$1"
else
  EMAIL="test+api_${TIMESTAMP}@crowai.dev"
fi

PASSWORD="${TEST_PASSWORD:-TestPassword123!}"
NAME="${TEST_NAME:-API Test User}"

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Complete Onboarding Flow E2E Test        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Email: $EMAIL"
echo "  Timestamp: $TIMESTAMP"
echo ""

# Helper function
call_api() {
  local method=$1
  local path=$2
  local data=$3
  local out="resp_$$.json"
  
  if [ -n "$data" ]; then
    http_code=$(curl -s -w "%{http_code}" -o "$out" \
      -X "$method" "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      -H "Origin: $ORIGIN" \
      -b "$COOKIES" -c "$COOKIES" \
      -d "$data")
  else
    http_code=$(curl -s -w "%{http_code}" -o "$out" \
      -X "$method" "$BASE_URL$path" \
      -H "Content-Type: application/json" \
      -H "Origin: $ORIGIN" \
      -b "$COOKIES" -c "$COOKIES")
  fi
  
  echo "$http_code"
  cat "$out"
  rm -f "$out"
}

# Step counter
STEP=0
SUCCESS_COUNT=0
FAIL_COUNT=0

run_step() {
  STEP=$((STEP + 1))
  echo -e "${YELLOW}Step $STEP: $1${NC}"
}

mark_success() {
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  echo -e "${GREEN}✓ Success${NC}"
  echo ""
}

mark_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo -e "${RED}✗ Failed${NC}"
  echo ""
}

# 1. Sign Up
run_step "Sign Up User"
response=$(call_api POST "$AUTH_PATH/sign-up/email" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}")
http_code=$(echo "$response" | head -1)
body=$(echo "$response" | tail -n +2)
echo "Status: $http_code"
USER_ID=$(echo "$body" | jq -r '.user.id' 2>/dev/null)
if [ "$http_code" = "200" ] && [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo "User ID: $USER_ID"
  mark_success
else
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  mark_fail
  exit 1
fi

# 2. Create Organization
run_step "Create Organization"
ORG_NAME="Test Org $TIMESTAMP"
response=$(call_api POST "$AUTH_PATH/organization/create" "{\"name\":\"$ORG_NAME\",\"slug\":\"test-org-$TIMESTAMP\"}")
http_code=$(echo "$response" | head -1)
body=$(echo "$response" | tail -n +2)
echo "Status: $http_code"
ORG_ID=$(echo "$body" | jq -r '.id' 2>/dev/null)
if [ "$http_code" = "200" ] && [ -n "$ORG_ID" ] && [ "$ORG_ID" != "null" ]; then
  echo "Organization ID: $ORG_ID"
  echo "Organization Name: $ORG_NAME"
  mark_success
else
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  mark_fail
  exit 1
fi

# 3. Start Onboarding
run_step "Start Onboarding"
response=$(call_api POST "$AUTH_PATH/onboarding/start" "{\"betterAuthUserId\":\"$USER_ID\"}")
http_code=$(echo "$response" | head -1)
body=$(echo "$response" | tail -n +2)
echo "Status: $http_code"
ONBOARDING_ID=$(echo "$body" | jq -r '.id // .onboarding.id' 2>/dev/null)
if [ "$http_code" = "201" ] && [ -n "$ONBOARDING_ID" ] && [ "$ONBOARDING_ID" != "null" ]; then
  echo "Onboarding ID: $ONBOARDING_ID"
  mark_success
else
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  mark_fail
  exit 1
fi

# 4. Complete Organization Step
run_step "Complete Organization Step"
response=$(call_api PATCH "$AUTH_PATH/onboarding/$ONBOARDING_ID/step/organization" "{\"betterAuthOrgId\":\"$ORG_ID\",\"organizationName\":\"$ORG_NAME\",\"betterAuthUserId\":\"$USER_ID\"}")
http_code=$(echo "$response" | head -1)
body=$(echo "$response" | tail -n +2)
echo "Status: $http_code"
if [ "$http_code" = "200" ]; then
  BILLING_BUILDER_ID=$(echo "$body" | jq -r '.onboarding.billingBuilderId' 2>/dev/null)
  echo "Billing Builder ID: $BILLING_BUILDER_ID"
  mark_success
else
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  mark_fail
  exit 1
fi

# 5. Complete Plan Step
run_step "Complete Plan Step"
response=$(call_api PATCH "$AUTH_PATH/onboarding/$ONBOARDING_ID/step/plan" '{"modules":{"web":true,"cctv":true,"social":true},"payAsYouGo":true,"billingPeriod":"monthly"}')
http_code=$(echo "$response" | head -1)
body=$(echo "$response" | tail -n +2)
echo "Status: $http_code"
if [ "$http_code" = "200" ]; then
  echo "Modules: Web, CCTV, Social (all enabled)"
  echo "Billing: Pay-as-you-go, Monthly"
  mark_success
else
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  mark_fail
  exit 1
fi

# 6. Complete Products Step
run_step "Complete Products Step"
PRODUCT_URL="${TEST_PRODUCT_URL:-https://example.com}"
response=$(call_api PATCH "$AUTH_PATH/onboarding/$ONBOARDING_ID/step/products" "{\"sourceType\":\"url\",\"sourceValue\":\"$PRODUCT_URL\"}")
http_code=$(echo "$response" | head -1)
body=$(echo "$response" | tail -n +2)
echo "Status: $http_code"
if [ "$http_code" = "200" ]; then
  echo "Product Source: $PRODUCT_URL"
  echo "Status: pending"
  mark_success
else
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  mark_fail
  exit 1
fi

# 7. Complete Onboarding
run_step "Complete Onboarding"
response=$(call_api POST "$AUTH_PATH/onboarding/$ONBOARDING_ID/complete" "")
http_code=$(echo "$response" | head -1)
body=$(echo "$response" | tail -n +2)
echo "Status: $http_code"
if [ "$http_code" = "200" ]; then
  COMPLETED_AT=$(echo "$body" | jq -r '.onboarding.completedAt' 2>/dev/null)
  STATUS=$(echo "$body" | jq -r '.onboarding.status' 2>/dev/null)
  echo "Onboarding Status: $STATUS"
  echo "Completed At: $COMPLETED_AT"
  mark_success
else
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  mark_fail
  exit 1
fi

# Clean up
rm -f "$COOKIES"

# Final Summary
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Test Results                              ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Success: $SUCCESS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""
echo -e "${BLUE}Account Details:${NC}"
echo "  Email: $EMAIL"
echo "  User ID: $USER_ID"
echo "  Organization ID: $ORG_ID"
echo "  Onboarding ID: $ONBOARDING_ID"
echo ""
echo -e "${GREEN}✓ Complete onboarding flow test successful!${NC}"

exit 0
