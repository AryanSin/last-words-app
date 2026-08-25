#!/usr/bin/env bash
set -e

echo "Deploying Last Words to Kubernetes..."

kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-postgres.yaml
kubectl apply -f k8s/04-redis.yaml

echo "Waiting for PostgreSQL and Redis..."
kubectl rollout status statefulset/postgres -n last-words --timeout=120s
kubectl rollout status statefulset/redis -n last-words --timeout=120s

if command -v docker &> /dev/null; then
  echo "Building Docker image..."
  docker build -t last-words-api:latest -f docker/Dockerfile.server .
fi

kubectl apply -f k8s/05-api.yaml

echo "Waiting for API Deployment to rollout..."
kubectl rollout status deployment/last-words-api -n last-words --timeout=120s

echo "Deployment completed."
echo "Check status: kubectl get all -n last-words"
