# Setting up OSRM

This script (`run.sh`) is not part of any deployment but is a record of the commands used to extract OSRM's US street network in case the project needs to extract other street networks & data in the future. 

`extract-osm-data.sh` is the script that actually runs in the `osrm-backend` docker container that processes the street network files

`run.sh` is a script you can run on a machine you have access to (with docker installed, with a lot of RAM) to create the data files needed to run an OSRM instance that can route within the continental U.S.