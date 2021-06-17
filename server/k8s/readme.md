# Kubernetes Configuration

```
k8s/
├── development
│   ├── cert.yml - certificate config for dev.gigbox.app
│   ├── dev-namespace.yml - namespace definition for development
│   ├── gigbox-server-deployment.yml - server deploy and service for development
│   ├── gigbox-server-pv.yml - persistent volume config for server
│   └── ingress.yml - ingress for development
├── production
│   ├── cert.yml
│   ├── gigbox-server-deployment.yml
│   ├── gigbox-server-pv.yml
│   └── ingress.yml
├── readme.md
└── shared
    ├── osrm-deployment.yml - OSRM service and deployment, shared across namespaces
    └── osrm-pv.yml - persistent volume for OSRM
```

# Steps to run on GKE

This setup has been tested using [GKE
Autopilot](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview).

To get both production and development up and running on a GKE cluster, follow these steps:

## Create Persistent Volumes

To run this project, we need three persistent volumes:

-   One for extracted OSRM data
-   One for gigbox (production)
-   One for gigbox (development)

To do this, create three persistent volumes, with the following config, in the same region. Make
note of which region you choose.

1. gigbox-server-prod
    - Size: 100GB
    - Type: Balanced persistent disk
1. gigbox-server-dev
    - Size: 100GB
    - Type: Balanced persistent disk
1. osrm-disk
    - Size: 100GB
    - Type: Balanced persistent disk

Then, spin up a new `E2` VM from the `VM Instances` section of the Compute Engine. Then, one at a
time for each disk, do the following. I do this in the cloud console because it's easier:

1. attach the disk to your new VM as detailed [here](https://cloud.google.com/compute/docs/disks/add-persistent-disk).
2. find the identifier for the disk using `lsblk`

3. Format and create filesystem on your new disk:

`sudo mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard/dev/<IDENTIFIER>`

4. Create a mount point:

`sudo mkdir -p /mnt/disks/disk`

5. Mount your new filesystem:

`sudo mount -o discard,defaults /dev/sdb /mnt/disks/osrm`

6. If your filesystem is one of `gigbox-server-prod` or `gigbox-server-dev`, then all you need to do
   here is create two directories at the filesystem root:

    `mkdir -p /mnt/disks/disk/exports`
    `mkdir -p /mnt/disks/disk/signatures`

7. If you're mounting the OSRM filesystem, we need co copy files from a public bucket with this
   command. The bucket specified here (`gs://osrm-gigbox-us`) should be publicly readable. This
   takes about 30 minutes.

`sudo gsutil -m cp gs://osrm-gigbox-us/* /mnt/disks/osrm/`

## Create SQL database

You don't have to host your database on google cloud, but if you're using it, it makes things
easier. Make a new cloud SQL instance, and install the `postgis` extension by opening up the console
and running `CREATE EXTENSION POSTGIS;`. Exit, and then make sure that your database is available
over a private IP, not public. Use the "default" IP range / network.

## Create Cluster and IPs

1. Reserve two static addresses. Go
   [here](https://console.cloud.google.com/networking/addresses/add?_ga=2.89636957.714866151.1623853737-264727538.1623853737)
   and reserve two static addresses, named `gigbox` and `gigbox-dev`. Make note of the IP addresses,
   and map your production and development domains (`api.gigbox.app` and `dev.gigbox.app`, in our
   case) to those IPs using your domain registrar.

2. Next, create an autopilot cluster with all-defaults. Name it whatever you like, and make sure it's in the same region as your disks above.

3. use the command available in the `connect` button on the top of the Google Console to add the
   cluster config to your workstation.

4. Load the env file as a secret. (see global README for example env file)

For production:
`k create secret generic env --from-env-file=.env`

For development:
`k create secret generic env-dev --from-env-file=.env.dev -n development`

4. Apply and be happy. Make sure to edit `server/k8s/development/cert.yml` and
   `server/k8s/production/cert.yml` to use the domain names you're using, and then apply away:

    `kubectl apply -f server/k8s/shared`
    `kubectl apply -f server/k8s/production`

    After a while, the ingress should provision a certificate for your domain, and you should be able
    to navigate to `https://your-gigbox-domain.app` and see `go to /graphql`

## Development / Staging

We have one namespace for development / staging, `development`. It pushes changes on the
`dev/server` branch, and is available at `dev.gigbox.app`. It uses the same OSRM server as
production because the needs are the same.

## Production

We use the default namespace for production (this is probably dangerous / should change)

# Deployment and Development deploys

Currently, running locally is difficult because of the resources that OSRM requires. Until we get a
development environment or endpoint for OSRM set up, only people with a server w/ ~ 40gb of ram will
be able to run this whole stack locally.
