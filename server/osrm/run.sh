#!/bin/bash

docker run \
    -e OSM_DATA_URL=${OSM_DATA_URL} \
    -e OSM_DATA_NAME=${OSM_DATA_NAME} \
    -d \
    --mount source=osrm-data,target=/opt \
    --mount type=bind,source="$(pwd)",target=/app \
    -it \
    --entrypoint=/bin/bash \
    osrm/osrm-backend:v5.24.0 \
    -i \
    /app/extract-osm-data.sh
