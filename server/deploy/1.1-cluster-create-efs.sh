#!/bin/bash
# Must be run if you do not already have a filesystem created
# Use this as an env variable in other scripts


echo -e "\nCreating EFS filesystem $FS_NAME..."

FS_ID=$(
    aws efs create-file-system \
        --performance-mode generalPurpose \
        --throughput-mode bursting \
        --tags Key=project,Value=$PROJECT_NAME \
        --encrypted --tags Key=Name,Value=$FS_NAME |
        jq -r '.FileSystemId'
)