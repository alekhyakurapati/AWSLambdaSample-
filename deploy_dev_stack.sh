#!/usr/bin/env bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Make sure layer packages are installed
# cd handlers
cd lambdas
npm install

CNF_WORKLOAD_DEPLOYMENT_ROLE_ARN=arn:aws:iam::739632194968:role/cnf/cnf-workload-deployment-role
CNF_CODEBUILD_PROJECT="local-dev-session"

cd ../

./assume-role.sh

# Deploy CDK app
cd infrastructure

cdk deploy
# cdk diff --context stage="${CDK_STAGE}"
# cdk deploy --all --ci --context stage="${CDK_STAGE}" --require-approval never
