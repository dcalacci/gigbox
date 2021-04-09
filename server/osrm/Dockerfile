FROM osrm/osrm-backend
RUN apt-get update
RUN apt-get install -y wget
# testing with california
RUN wget http://download.geofabrik.de/north-america/us/california-latest.osm.pbf
# RUN wget http://download.geofabrik.de/north-america/us-northeast-latest.osm.pbf
RUN osrm-extract -p /opt/car.lua california-latest.osm.pbf
RUN osrm-partition california-latest.osrm
RUN osrm-customize california-latest.osrm
EXPOSE 5000
