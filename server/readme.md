# gigbox-server

This is the server-side API for the gigbox project, including:

-   the GraphQL api used to run the gigbox mobile app
-   the OSRM setup used for map-matching
-   deploy scripts to get your own version of the gigbox project running on your own (aws)
    infrastructure, namely an ECS cluster.

## Installation / requirements

To get started using the server in development, there are a couple of steps that require some
heavy compute.

Because this project aims to keep data collection and sharing at an absolute minimum, we use
an open-source map routing system, [OSRM](http://project-osrm.org/). Unfortunately, to run
OSRM locally, it requires ~70gb of disk space for a docker volume to store the OSM street
graph for the entire U.S. It also requires about 40gb of RAM to run the routing itself, which
means that to run this server yourself, you either need a pretty beefy server locally, or you
need to pay for a pretty large instance on AWS or some other provider.

### Extracting / setting up the Open Source Routing Machine

Running OSRM requires that you have an extracted and processed Open Street Map network
available in a docker volume. There are two ways to create this:

1. Use scripts in the `osrm/` directory, namely `osrm/run.sh` to download the streetmap and
   extract and process the road networks yourself, on your own infrastructure. This is
   required if you want to use a different street network than `us-latest`. You can find
   other street networks [here](http://download.geofabrik.de/index.html). This script will save the
   downloaded and extracted data to a volume, `osrm-data`, that you can then use in the server. For
   example, to download and process the us-northeast road map, available
   [here](http://download.geofabrik.de/north-america/us-northeast.html):

    ```bash
    $ OSM_DATA_URL=http://download.geofabrik.de/north-america/us-northeast.html OSM_DATA_NAME=us-northeast-latest run.sh
    ```

2. Don't want the hassle? Use a pre-extracted version of the `us-latest` road network, available in this S3 bucket:
   `s3://osrm-us-latest`. Download that or use it as a docker volume in development.

## Running & environment

You need these environment variables saved in a `/deploy/.env` file to deploy to AWS. To develop,
you need all variables up to `AWS_ACCESS_KEY`, and you should change `ENV` to `ENV=DEVELOPMENT`.

```
ENV=PRODUCTION
SECRET_KEY={your big secret}

TWILIO_NUMBER={twilio-from-number}
TWILIO_SID={twilio-sid}
TWILIO_TOKEN={twilio-token}

DB_HOST=db
DB_PORT=5432
POSTGRES_USER=gigbox
POSTGRES_PASSWORD={secret-password-here}
POSTGRES_DB=gigbox

AWS_ACCESS_KEY_ID={aws access key id}
AWS_SECRET_ACCESS_KEY={aws secret}
PROJECT_NAME=gigbox-test-end2end
PROFILE_NAME=gigbox-end2end-profile
CLUSTER_NAME=gigbox-test-end2end-cluster
REGION=us-east-1
LAUNCH_TYPE=EC2
INSTANCE_TYPE=m5.4xlarge
KEYPAIR=gigbox-dev-aws

FS_ID=fs-7c0db8c8
FS_ID={EFS id that has osrm-data in /osrm }
FS_NAME=gigbox-data
OSRM_DATASYNC_SOURCE=arn:aws:s3:::osrm-us-latest
IAM_POLICY_NAME=gigbox-osrm-policy
IAM_ROLE_NAME=gigbox-osrm-access
```
