#!/bin/bash

## DATA SYNC TASK BELOW

# --subdirectory /osrm \
# create datasync locations for filesystem
efs_location_arn=$(aws datasync create-location-efs \
--tags Key=project,Value=$PROJECT_NAME \
--efs-filesystem-arn "arn:aws:elasticfilesystem:$REGION:$ACCOUNT_ID:file-system/$FS_ID" \
--ec2-config SecurityGroupArns="arn:aws:ec2:$REGION:$ACCOUNT_ID:security-group/$vpc_sg",SubnetArn="arn:aws:ec2:$REGION:$ACCOUNT_ID:subnet/$vpc_subnet0" | jq -r ".LocationArn")


### CREATE ROLE AND IAM POLICY FOR ACCESSING THE s3 BUCKET ##################################333
echo "Checking if policy exists..."

## TODO: Check more thoroughly:
## if role exists, detach from our policy

if [[ $(aws iam list-policies | jq '.Policies | map(select(.PolicyName == $ENV.IAM_POLICY_NAME))') =~ $IAM_POLICY_NAME ]]
then
    echo "IAM policy already seems to exist. Not adding any roles or policies and hoping for the best..."
else
echo "Creating IAM policy for S3 access to OSRM data..."
# create role
ROLE_FILE=$(mktemp -t sync.iam.role.XXXXXX.json)
# ROLE_FILE="./sync.iam.role.xxxxxx.json"
# cat > ${ROLE_FILE} << EOF
cat << EOF > ${ROLE_FILE}
{
"Version": "2012-10-17",
"Statement": [
    {
    "Effect": "Allow",
    "Principal": {
        "Service": "datasync.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
    }
]
}
EOF

# policy_arn=$(aws iam list-policies | jq '.Policies | map(select(.Policyname == $ENV.IAM_POLICY_NAME)) | .[0].Arn')

aws iam create-role --role-name ${IAM_ROLE_NAME}  --assume-role-policy-document file://${ROLE_FILE}
## Create policy for role
POLICY_FILE=$(mktemp -t sync.iam.policy.XXXXXX.json)
cat << EOF > ${POLICY_FILE}
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "s3:GetBucketLocation",
                "s3:ListBucket",
                "s3:ListBucketMultipartUploads"
            ],
            "Effect": "Allow",
            "Resource": "$OSRM_DATASYNC_SOURCE"
        },
        {
            "Action": [
                "s3:AbortMultipartUpload",
                "s3:DeleteObject",
                "s3:GetObject",
                "s3:ListMultipartUploadParts",
                "s3:PutObjectTagging",
                "s3:GetObjectTagging",
                "s3:PutObject"
            ],
            "Effect": "Allow",
            "Resource": "$OSRM_DATASYNC_SOURCE/*"
        }
    ]
}
EOF

# aws iam delete-policy --policy-name ${IAM_POLICY_NAME}
aws iam create-policy \
--policy-name ${IAM_POLICY_NAME}  \
--policy-document file://${POLICY_FILE}

# Attach the policy to our new role.
aws iam attach-role-policy \
--role-name $IAM_ROLE_NAME \
--policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$IAM_POLICY_NAME"

## TODO: have to manually attach this policy to your IAM user that you're using. 
## How do we do this from the CLI?
fi

username=$(aws iam get-user | jq -r '.User.UserName')

aws iam attach-user-policy \
--user-name $username \
--policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$IAM_POLICY_NAME"

# create location for s3 bucket and save ARN
s3_location_arn=$(aws datasync create-location-s3 \
    --s3-bucket-arn $OSRM_DATASYNC_SOURCE \
    --tags Key=project,Value=$PROJECT_NAME \
    --s3-storage-class 'STANDARD' \
    --s3-config "BucketAccessRoleArn=arn:aws:iam::$ACCOUNT_ID:role/$IAM_ROLE_NAME" \
    --subdirectory / | jq -r ".LocationArn")
 
datasync_task_arn=$(aws datasync create-task \
    --source-location-arn $s3_location_arn \
    --destination-location-arn $efs_location_arn \
    --name gigbox-osrm-transfer | jq -r ".TaskArn")

echo -e "\n\tStarting task: $datasync_task_arn"

task_execution_arn=$(aws datasync start-task-execution --task-arn $datasync_task_arn | jq -r '.TaskExecutionArn')

sleep 5s;


echo -e "Transferring data:"
echo -en "\n> Launching"

until [[ $(aws datasync describe-task-execution --task-execution-arn $task_execution_arn | jq -r '.Status') != 'LAUNCHING' ]]
do
    echo -n "."
done

echo -en "\n> Transferring..."
until [[ $(aws datasync describe-task-execution --task-execution-arn $task_execution_arn | jq -r '.Status') != 'TRANSFERRING' ]]
do
    echo -n "."
done

echo -en "\n> Verifying..."
until [[ $(aws datasync describe-task-execution --task-execution-arn $task_execution_arn | jq -r '.Status') != 'VERIFYING' ]]
do
    echo -n "."
done

