#!/bin/bash
# Setting HOSTNAME
HOSTNAME=$1
EMAIL=$2

######################################################
# install microk8s
echo "> Installing microk8s..."
#sudo snap install microk8s --classic
#sudo usermod -a -G microk8s $USER
#sudo chown -f -R $USER ~/.kube
#newgrp microk8s # enable microk8s usage

echo "> Enabling plugins..."
# enable helm, dns, dashboard, storage, and ingress
microk8s enable helm3 dns dashboard storage ingress

echo "> Adding helm repos.."
# add necessary repos (ingress, cert-manager)
microk8s helm3 repo add jetstack https://charts.jetstack.io 
microk8s helm3 repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

# create our ingress
microk8s helm3 repo update 
microk8s helm3 install quickstart ingress-nginx/ingress-nginx 

# Install cert-manager

echo "> Installing cert-manager..."
microk8s helm3 install \
  cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.5.3 \
  --set installCRDs=true

echo "> Installing gigbox chart using values.yml...."
microk8s helm3 install --upgrade gigbox k8s/helm/gigbox-chart \
    -f values.yml

#######################################################
# Start NFS service for signatures, images, other data
#sudo mkdir -p /data/gigbox
#docker-compose -f nfs-compose.yml up -d
#CURRENT_IP=$(hostname -I | awk '{print $1}')
#echo "Created an NFS share at this machine at ${CURRENT_IP}:2049"