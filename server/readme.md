# gigbox-server

This is the server-side API for the gigbox project, including:

-   the GraphQL api used to run the gigbox mobile app
-   the OSRM setup used for map-matching
-   Helm chart that makes running the OSRM server, the gigbox-server api, and a postgis instance quite easy


## Installing and running locally

To get started using the server in development locally, there are a couple of steps that require some
heavy compute.

Because this project aims to keep data collection and sharing with 3rd parties at an absolute minimum, we use
an open-source map routing system, [OSRM](http://project-osrm.org/). Unfortunately, to run
OSRM locally, it requires ~70gb of disk space for a docker volume to store the OSM street
graph for the entire U.S. It also requires about 40gb of RAM to run the routing itself, which
means that to run this server yourself, you either need a pretty beefy server locally, or you
need to pay for a pretty large instance on AWS or some other provider.

To run in development mode, set your env vars and run `docker-compose`:

```bash
cat >> .env <<EOF
ENV=DEVELOPMENT
SECRET_KEY=painting-pen-donkey-muse

OSRM_URI=http://osrm:5000

TWILIO_NUMBER=+15555555555
TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token

DB_HOST=127.0.0.1 (your DB IP/hostname)
DB_PORT=5432
POSTGRES_USERNAME=gigbox
POSTGRES_USER=gigbox
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DB=gigbox-development
EOF

export $(cat .env)

docker-compose up
```

### Extracting / setting up the Open Source Routing Machine

Running OSRM requires that you have an extracted and processed Open Street Map network
available in a directory on the host machine running the code. There are two ways to create this:

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

## Helm Values

```yaml

# This is your api hostname. It should be the hostname that will 
# receive all network requests. 

# Helm will automatically provision an HTTPS cert at this domain using
# this contact email using LetsEncrypt
apiHostname: gigbox-osrm.media.mit.edu
certEmail: dcalacci@media.mit.edu

# Path on the host machine that contains the OSRM data for `us-latest`.
hostOSRMPath: /home/dcalacci/osrm-data
hostGigboxDataPath: /home/dcalacci/gigbox-data

# Twilio auth. 
twilioNumber: "+15555555555"
twilioSid: random-sid 
twilioToken: random-token

# Database details and postgres login
dbHost: 127.0.0.1
dbPort: 5432
postgresUser: gigbox
postgresPassword: my-postgres-passwd 
postgresDbName: gigbox-development

# Secret key for authentication
secretKey: very-secret-key

# Env setting. Set to 'PRODUCTION' when running in production
env: DEVELOPMENT
```
