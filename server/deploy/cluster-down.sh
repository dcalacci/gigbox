#!/bin/bash

echo -e "\n> Running ecs-cli compose service down..."
ecs-cli compose \
--project-name $PROJECT_NAME \
--file docker-compose-test.yml \
--debug service down \
--region $REGION \
--ecs-profile $PROFILE_NAME \
--cluster-config $PROFILE_NAME 
