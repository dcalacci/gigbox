# Running locally

(method taken from [here](https://blog.meain.io/2020/mounting-s3-bucket-kube/))
So we use the `s3-config.yml` and the `daemonset.yml` to mount an s3 bucket through s3fs on
the OSRM pod. When running locally, even with a gigabit connection, this is very very slow to
get started because OSRM essentially loads that entire S3 bucket into memory on first
startup.

Until that happens, OSRM is unresponsive -- it refuses connections on its normal port, 5000.
5/29/21 - I am waiting for my server to, I think, load the entirety of that bucket into RAM
to see if the port opens up and this will really work. If its not this, there's a
misconfiguration somewhere in our kubernetes files that I'm missing that is stopping our
server from connecting. The way I'm testing is:

```
k exec -it pod/gigbox-server-xxxxx -- bash
$ curl osrm:5000
```

if this returns, then it means the OSRM service is really up.

I've been looking at the ram that the service is using by:

```
k exec -it pod/osrm-xxxx --bash
cat /sys/fs/cgroup/memory/memory.usage_in_bytes
```

After 45 minutes, it spiked to 65040429056, and then down to 52818358272. It being stable at
52... makes me think that the service might be up? But it's hard to know. osrm:5000 is still
giving me a connection refused error

# Using eksctl

Use [this IAM
policy](https://gist.githubusercontent.com/jpadams/d1b076a6308346d581bc362360a858d0/raw/c28f6037d7979885434d04fe367b0f9c1c1022e7/eksctl-policy)
and attach it to whatever user you're using for deploy.

Then create the cluster

```
eksctl create cluster -f cluster.yml
```

## auth errors

I received this error pretty consistently to start:

> "Your current user or role does not have access to Kubernetes objects on this EKS cluster"

According to [this](https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html) we
need to configure a configmap for our cluster with some auth information. I did that, using
the role made by eksctl [see
here](https://console.aws.amazon.com/iam/home?region=us-east-1#/roles/eksctl-gigbox-test-cluster-ServiceRole-ZFGSB8KYKL1L)
