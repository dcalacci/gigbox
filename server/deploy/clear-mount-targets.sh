#!/bin/bash
echo -e "\n> Clearing mount targets from file system $FS_ID so the VPC (and full cluster) can be brought down."
echo -e "\n>> NOTE: If you re-deploy your cluster, make sure to run 2-cluster-configure-efs.sh to re-create these mount targets."
aws efs describe-mount-targets --file-system-id $FS_ID |
    jq ".MountTargets[0].MountTargetId" |
    xargs -IMOUNTG aws efs delete-mount-target \
        --mount-target-id MOUNTG

