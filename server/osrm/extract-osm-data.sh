#!/bin/bash
apt-get update
apt-get install -y wget
cd /opt/
wget $OSM_DATA_URL
# wget http://download.geofabrik.de/north-america/us-latest.osm.pbf
osrm-extract -p /opt/car.lua ${OSM_DATA_NAME}.osm.pbf
osrm-partition ${OSM_DATA_NAME}.osrm
osrm-customize ${OSM_DATA_NAME}.osrm

