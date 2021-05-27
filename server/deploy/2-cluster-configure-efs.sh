#!/bin/bash

## TODO: create two filesystems - one for database and one for screenshots
#aws efs create-file-system --performance-mode generalPurpose --throughput-mode bursting --encrypted --tags Key=Name,Value=osrm-data
# Given an existing filesystem, make sure that our VPC allows nfs connections to the EFS (filesystem) with the correct ports
# this filesystem ID will be used in our ecs-params.yml so ECS knows to mount it from our docker-compose.yml
# NOTES:
# - MAKE SURE the EFS you are using DOES NOT have any existing mount points, and is on the same VPC.
# After your ECS VPC is created, you can change the VPC of your EFS to match the one from your ECS.
# otherwise, if you use the above command to create a filesystem, make sure to just use datasync to transfer a processed us-latest.osrm directory to it before continuing.

#TODO: script to automatically create EFS and create datasync task from our S3 bucket with processed files

## Create FS for osrm-data

echo -n "> Waiting for filesystem to become available..."
until [[ $(aws efs describe-file-systems --file-system-id ${FS_ID} --region $REGION | jq -r ".FileSystems[0].LifeCycleState") =~ 'available' ]];
do
    echo -n "."
    sleep 5s
done

echo -e "\n> Filesystem is available. continuing..."

ACCOUNT_ID=$(aws sts get-caller-identity | jq -r ".Account")

echo -e "\n> Testing for access points on $FS_ID..."

if ! [[ $(aws efs describe-access-points --file-system-id $FS_ID --region $REGION | jq '.AccessPoints | map(.RootDirectory.Path)') =~ '/db' ]];
then
echo -e "\nCreating db access point on $FS_ID"
## Access point for database
aws efs create-access-point \
--region $REGION \
--file-system-id $FS_ID \
--root-directory '{"Path": "/db", "CreationInfo": {"Permissions": "755", "OwnerUid": 999, "OwnerGid": 999}}' \
--posix-user '{"Uid": 999, "Gid": 999}'
## We use UID/GID 999 here because this is the default for postgres
## see https://github.com/docker-library/postgres/search?q=UID
## and https://github.com/docker-library/postgres/commit/8f8c0bbc5236e0deedd35595c504e5fd380b1233
fi

if ! [[ $(aws efs describe-access-points --file-system-id $FS_ID --region $REGION | jq '.AccessPoints | map(.RootDirectory.Path)') =~ '/screenshots' ]];
then
echo -e "\nCreating server access point on filesystem..."
## Access point for gigbox-server
## uwsgi-nginx-flask changes UID/GID to root
aws efs create-access-point \
--region $REGION \
--file-system-id $FS_ID \
--root-directory '{"Path": "/screenshots", "CreationInfo": {"Permissions": "755", "OwnerUid": 0, "OwnerGid": 0}}' \
--posix-user '{"Uid": 0, "Gid": 0}'
fi

echo -e "\n> Creating mount points for each subnet on filesystem..."
echo -e "\n> This script does not check for existing mount targets or security group rules. If they already exist,\
The script will not fail, but will report errors. This is normal!"
## Create mount points for each subnet ECS created
aws ec2 describe-subnets --filters Name=tag:project,Values=$PROJECT_NAME --region $REGION |
    jq ".Subnets[].SubnetId" |
    xargs -ISUBNET aws efs create-mount-target --region $REGION \
        --file-system-id $FS_ID --subnet-id SUBNET

## get the security groups for our EFS mount targets
efs_sg=$(aws efs describe-mount-targets --file-system-id $FS_ID --region $REGION |
    jq ".MountTargets[0].MountTargetId" |
    xargs -IMOUNTG aws efs describe-mount-target-security-groups --region $REGION \
        --mount-target-id MOUNTG | jq ".SecurityGroups[0]" | xargs echo)

echo -en "\nWaiting for mount targets to become available..."
until [[ $(aws efs describe-mount-targets --region $REGION --file-system-id $FS_ID | jq -r ".MountTargets[].LifeCycleState") =~ 'available' ]];
do
    echo -n "."
    sleep 5s;
done

echo -e "\nCreating EFS Location....";
vpc_subnet0=$(aws ec2 describe-subnets --region $REGION --filters Name=tag:project,Values=$PROJECT_NAME |
    jq -r ".Subnets[0].SubnetId")

## Get security group for our VPC
vpc_sg="$(aws ec2 describe-security-groups --region $REGION \
    --filters Name=tag:project,Values=$PROJECT_NAME | jq -r '.SecurityGroups[0].GroupId')"


## TODO: This seems like it doesn't work anymore...
if [[ $(aws ec2 describe-security-groups --region $REGION --group-ids $efs_sg| jq '.SecurityGroups[0].IpPermissions | map(.FromPort)') =~ "2049" ]]
then
    echo -e "\n> not creating security group ingress rule -- it already exists."
else

    echo -e "\n> Authorizing security group ingress on port 2049 to enable NFS access from SG $vpc_sg (the vpc) to mount target SG $efs_sg"
    ## Open those ports, baby
    aws ec2 authorize-security-group-ingress \
        --group-id $efs_sg \
        --protocol tcp \
        --port 2049 \
        --source-group $vpc_sg \
        --region $REGION
fi


screenshot_arn_id=$(aws efs describe-access-points --region $REGION --file-system-id $FS_ID | jq -r '.AccessPoints | map(select(.RootDirectory.Path | contains("screenshots"))) | .[] | .AccessPointId')
db_arn_id=$(aws efs describe-access-points --region $REGION --file-system-id $FS_ID | jq -r '.AccessPoints | map(select(.RootDirectory.Path | contains("db"))) | .[] | .AccessPointId')


echo -e "- Creating ecs-params.yml"

##TODO: ecs-params needs accesspoint data in database-data and server-data
## instead of root_directory

cat <<EOF > ecs-params.yml
version: 1
task_definition:
  services:
    osrm:
      mem_limit: 40g
      mem_reservation: 30g
      essential: true
    db:
      mem_reservation: 4g
      essential: true
    gigbox-server:
      mem_reservation: 4g
      essential: true

  ecs_network_mode: bridge
  efs_volumes:
    - name: osrm-data
      filesystem_id: $FS_ID
      root_directory: /osrm
    - name: server-data
      filesystem_id: $FS_ID
      access_point: $screenshot_arn_id
      transit_encryption: ENABLED
    - name: database-data
      filesystem_id: $FS_ID
      access_point: $db_arn_id
      transit_encryption: ENABLED
EOF

echo -e "\n> EFS Configured for your cluster."


echo -e "\n> Bringing cluster up...."

ecs-cli compose \
--project-name $PROJECT_NAME \
--file docker-compose-test.yml \
--debug service up \
--region $REGION \
--ecs-profile $PROFILE_NAME \
--cluster-config $PROFILE_NAME \
--create-log-groups
