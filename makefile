#!/bin/sh -l

# Define variables

IMAGE_PROD=izdrail/agent.izdrail.com:latest
DOCKERFILE=Dockerfile
DOCKER_COMPOSE_FILE=docker-compose.yaml
DOCKER_COMPOSE_FILE_PROD=docker-compose.yaml
CODE=""

build:
	docker image rm -f $(IMAGE_PROD) || true
	docker buildx build \
		--platform linux/amd64 \
		-t $(IMAGE_PROD) \
		--no-cache \
		--progress=plain \
		--build-arg CACHEBUST=$$(date +%s) \
		-f $(DOCKERFILE) \
		.  # <-- Build Context Docker file is located at root

dev:
	docker-compose -f $(DOCKER_COMPOSE_FILE_PROD) up --remove-orphans
prod:
	docker-compose -f $(DOCKER_COMPOSE_FILE_PROD) up --remove-orphans

down:
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

ssh:
	docker exec -it agent.izdrail.com /bin/bash
