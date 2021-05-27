#!/bin/bash

vpc_sg="$(aws ec2 describe-security-groups --region $REGION \
    --filters Name=tag:project,Values=$PROJECT_NAME | jq -r '.SecurityGroups[0].GroupId')"

efs_sg=$(aws efs describe-mount-targets --file-system-id $FS_ID --region $REGION |
    jq ".MountTargets[0].MountTargetId" |
    xargs -IMOUNTG aws efs describe-mount-target-security-groups --region $REGION \
        --mount-target-id MOUNTG | jq ".SecurityGroups[0]" | xargs echo)

aws ec2 revoke-security-group-ingress \
    --group-id $efs_sg \
    --protocol tcp \
    --port 2049 \
    --source-group $vpc_sg \
    --region $REGION

