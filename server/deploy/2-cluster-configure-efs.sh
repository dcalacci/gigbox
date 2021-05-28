#!/bin/bash

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

ACCOUNT_ID=$(aws sts get-caller-identity --region $REGION | jq -r ".Account")

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

if ! [[ $(aws efs describe-access-points --file-system-id $FS_ID --region $REGION | jq '.AccessPoints | map(.RootDirectory.Path)') =~ '/server_data' ]];
then
echo -e "\nCreating server access point on filesystem..."
## Access point for gigbox-server
## uwsgi-nginx-flask changes UID/GID to root
aws efs create-access-point \
--region $REGION \
--file-system-id $FS_ID \
--root-directory '{"Path": "/server_data", "CreationInfo": {"Permissions": "755", "OwnerUid": 0, "OwnerGid": 0}}' \
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

echo -e "\n> Ensuring ingress rule from load balancer to ECS is open..."

LOAD_BALANCER_ARN=arn:aws:elasticloadbalancing:us-east-1:714042534292:loadbalancer/app/gigbox-deploy/60285c6951a6a85d
TARGET_GROUP_ARN=arn:aws:elasticloadbalancing:us-east-1:714042534292:targetgroup/gigbox-deploy/978e71d03de42b3a

load_balancer_sg=$(aws elbv2 describe-load-balancers --load-balancer-arn $LOAD_BALANCER_ARN | jq -r '.LoadBalancers[0].SecurityGroups[0]')
echo -e "\n\t> ingress for vpc sg $vpc_sg"

aws ec2 authorize-security-group-ingress \
    --group-id $vpc_sg \
    --source-group $load_balancer_sg \
    --protocol tcp \
    --port 0-65535 \
    --region $REGION


echo -e "\n\t> ingress for load balancer sg $load_balancer_sg"
aws ec2 authorize-security-group-ingress \
    --source-group $vpc_sg \
    --group-id $load_balancer_sg \
    --protocol tcp \
    --port 0-65535 \
    --region $REGION

echo -e "\n\t>Adding vpc security group to load balancer..."
aws elbv2 set-security-groups \
    --load-balancer-arn $LOAD_BALANCER_ARN \
    --security-groups $vpc_sg



server_data_arn_id=$(aws efs describe-access-points --region $REGION --file-system-id $FS_ID | jq -r '.AccessPoints | map(select(.RootDirectory.Path | contains("server_data"))) | .[] | .AccessPointId')
db_arn_id=$(aws efs describe-access-points --region $REGION --file-system-id $FS_ID | jq -r '.AccessPoints | map(select(.RootDirectory.Path | contains("db"))) | .[] | .AccessPointId')


echo -e "- Creating ecs-params.yml"

##TODO: ecs-params needs accesspoint data in database-data and server-data
## instead of root_directory

cat <<EOF > ecs-params.yml
version: 1
task_definition:
  services:
    osrm:
      mem_reservation: 10g
      essential: true
    db:
      mem_reservation: 1g
      essential: true
    gigbox-server:
      mem_reservation: 1g
      essential: true

  ecs_network_mode: bridge
  efs_volumes:
    - name: osrm-data
      filesystem_id: $FS_ID
      root_directory: /osrm
    - name: server-data
      filesystem_id: $FS_ID
      access_point: $server_data__arn_id
      transit_encryption: ENABLED
    - name: database-data
      filesystem_id: $FS_ID
      access_point: $db_arn_id
      transit_encryption: ENABLED
EOF

echo -e "\n> EFS Configured for your cluster."


echo -e "\n> Creating task definition, bringing up service, and connecting to ELB..."

ecs-cli compose \
--project-name $PROJECT_NAME \
--file docker-compose-test.yml \
--debug service up \
--timeout 20 \
--region $REGION \
--ecs-profile $PROFILE_NAME \
--cluster-config $PROFILE_NAME \
--deployment-max-percent 100 \
--deployment-min-healthy-percent 0 \
--create-log-groups \
--target-groups "targetGroupArn=$TARGET_GROUP_ARN,containerPort=80,containerName=$CONTAINER_NAME"


# create service with above created task definition & elb
# aws ecs create-service \
#     --service-name "$PROJECT_NAME" \
#     --cluster "$CLUSTER_NAME" \
#     --task-definition "$CLUSTER_NAME" \
#     --load-balancers "targetGroupARN=$TARGET_GROUP_ARN,"
#     --load-balancers "loadBalancerName=$CLUSTER_NAME,containerName='gigbox-server',containerPort=8080" \
#     --desired-count 1 \
#     --deployment-max-percent 100 \
#     --deployment-min-healthy-percent 0 \
#     --create-log-groups \
#     --deployment-configuration "maximumPercent=200,minimumHealthyPercent=50" \
#     --role ecsServiceRole
