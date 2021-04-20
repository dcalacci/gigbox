FROM osrm/osrm-backend
RUN apt-get update
RUN apt-get install -y wget
# testing with california
RUN wget http://download.geofabrik.de/north-america/us-latest.osm.pbf
# RUN wget http://download.geofabrik.de/north-america/us-northeast-latest.osm.pbf
RUN osrm-extract -p /opt/car.lua us-latest.osm.pbf
RUN osrm-partition us-latest.osrm
RUN osrm-customize us-latest.osrm
EXPOSE 5000
