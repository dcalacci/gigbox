# Deployment and Development deploys

Currently, running locally is difficult because of the resources that OSRM requires. Until we get a
development environment or endpoint for OSRM set up, only people with a server w/ ~ 40gb of ram will
be able to run this whole stack locally.

Until then, the easiest way to develop _and_ deploy is through using [eksctl](https://eksctl.io/)
and the kubernetes manifests included here.

# Running locally

(method taken from [here](https://blog.meain.io/2020/mounting-s3-bucket-kube/))
So we use the `s3-config.yml` and the `daemonset.yml` to mount an s3 bucket through s3fs on
the OSRM pod. When running locally, even with a gigabit connection, this is very very slow to
get started because OSRM essentially loads that entire S3 bucket into memory on first
startup.

Until that happens, OSRM is unresponsive -- it refuses connections on its normal port, 5000.

To instead create a volume from data hosted in s3 locally in order to run OSRM, create a volume and
copy data from the osrm bucket to it. Instructions for doing this forthcoming!

# Create configmaps

To run locally or on AWS, you need to create two configmaps:

## Configmap 1: `k8s/configmap.yml`

```
apiVersion: v1
kind: ConfigMap
metadata:
    name: gigbox-config
    labels:
      app: gigbox-server
data:
    postgres_user: "gigbox"
    postgres_password: "postgres-password"
    postgres_db: "gigbox"
    secret_key: "a-very-secret-key"
    twilio_number: "<twilio-number>>"
    twilio_sid: "<tiwlio-sid>"
    twilio_token: "<twilio-token>"
    db_host: "db"
    db_port: "5432"
    data_dir: "/opt/data"
    env: "PRODUCTION"
    region: "us-east-1"
```

## Configmap 2: `k8s/aws-config.yml`

This is used to provide credentials to mount the S3 bucket containing the extracted OSRM data
on our nodes, which allows OSRM to run without you having to configure any volumes.

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: aws-config
data:
    S3_REGION: "us-east-1"
    S3_BUCKET: "osrm-us-latest"
    AWS_KEY: "aws-key"
    AWS_SECRET_KEY: "aws-secret-key"
```

# Deploy Using eksctl

1. Create a policy using the file at `server/k8s/aws/iam_policy.json` and attach it to the user or role
   you're using to deploy. This policy includes all the permissions needed to update an EKS
   cluster, create domain routes, and take things down appropriately.

## Enable SSL Termination at Route53

Using instructions from
[here](https://aws.amazon.com/premiumsupport/knowledge-center/terminate-https-traffic-eks-acm/):

1. Create an SSL cert using [AWS
   ACM](https://console.aws.amazon.com/acm/home?region=us-east-1#/) for the custom domain you
   want to point to your deployment.
2. Edit `server/k8s/gigbox-server-deployment.yml` and replace the value of the
   key `service.beta.kubernetes.io/aws-load-balancer-ssl-cert` with the ARN of the certificate
   you just made.
3. Once your cluster is created (see below) and you apply your manifests, make sure your
   domain name points to the load balancer domain. If your certificate settings are working
   properly, you should be able to go to `https://gigbox.mycustomdomain.com` and get a
   response `go to /graphql`.

## Create your EKS cluster

Set your user that has the IAM policies attached using `aws configure` on your local machine, then create a new cluster using the
`cluster.yml`:

```
eksctl create cluster -f server/k8s/aws/cluster.yml
```

Once your cluster is created, apply the manifests:

```
kubectl apply -f server/k8s/
```

Check that the services are running by confirming that:

```
curl $(kubectl get svc gigbox-server -o json | jq .status.loadBalancer.ingress[0].hostname)
```

returns:

```
$ curl $(kubectl get svc gigbox-server -o json | jq .status.loadBalancer.ingress[0].hostname)
go to /graphql
```

## auth errors

I received this error pretty consistently to start:

> "Your current user or role does not have access to Kubernetes objects on this EKS cluster"

This is because **only the original user that created the cluster can access its resources without
additional configuration**

According to [this](https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html), to enable
wider access, you'll
need to configure a configmap for our cluster with some auth information [see
here](https://console.aws.amazon.com/iam/home?region=us-east-1#/roles/eksctl-gigbox-test-cluster-ServiceRole-ZFGSB8KYKL1L). I haven't tested this fully.
