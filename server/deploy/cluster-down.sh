#!/bin/bash


## clear mount targets
echo -e "\nBringing down your cluster..."
echo -e "\n> Clearing mount targets from file system $FS_ID so the VPC (and full cluster) can be brought down."
echo -e "\n>> NOTE: If you re-deploy your cluster, make sure to run 2-cluster-configure-efs.sh to re-create these mount targets."
aws efs describe-mount-targets --file-system-id $FS_ID |
    jq ".MountTargets[0].MountTargetId" |
    xargs -IMOUNTG aws efs delete-mount-target \
        --mount-target-id MOUNTG

echo -e "\n> Running ecs-cli compose service down..."
ecs-cli compose \
--project-name $PROJECT_NAME \
--file docker-compose-test.yml \
--debug service down \
--region $REGION \
--ecs-profile $PROFILE_NAME \
--cluster-config $PROFILE_NAME 