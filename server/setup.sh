#!/bin/bash

# Install kubeadm, kubernetes
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl

sudo curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg

echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

#######################################################
# Start NFS service for signatures, images, other data
sudo mkdir -p /data/gigbox
docker-compose -f nfs-compose.yml up -d
CURRENT_IP=$(hostname -I | awk '{print $1}')
echo "Created an NFS share at this machine at ${CURRENT_IP}:2049"

#######################################################
# Create cluster, assign IPs
sudo kubeadm init --ignore-preflight-errors=swap --pod-network-cidr=192.168.0.0/16
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

#######################################################
# Install kube-router
kubectl apply -f https://raw.githubusercontent.com/cloudnativelabs/kube-router/master/daemonset/kubeadm-kuberouter.yaml