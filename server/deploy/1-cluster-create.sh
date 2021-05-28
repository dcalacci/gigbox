#!/usr/bin/env bash


# creates an ECS cluster of size 1 to run our docker-compose setup
ecs-cli up \
--keypair $KEYPAIR \
--capability-iam \
--size 1 \
--instance-type $INSTANCE_TYPE \
--cluster-config $PROFILE_NAME \
--tags project=$PROJECT_NAME \
