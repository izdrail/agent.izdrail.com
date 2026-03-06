IMAGE       := izdrail/agent.izdrail.com
TAG         ?= latest
COMPOSE     := docker-compose
DOCKERFILE  := Dockerfile

# Detect current user IDs
WWWUSER     ?= $(shell id -u)
WWWGROUP    ?= $(shell id -g)

# Export for docker-compose
export WWWUSER
export WWWGROUP

.DEFAULT_GOAL := help

.PHONY: help
help:
	@echo ""
	@echo "  agent.izdrail.com"
	@echo "  -------------------------------------------"
	@echo "  make dev          Start Next.js dev server locally"
	@echo "  make prod         Start containers (up -d --build)"
	@echo "  make down         Stop and remove containers"
	@echo "  make logs         Tail container logs"
	@echo "  make fresh        [DOCKER] Clean + npm install + build"
	@echo "  make clean        Remove .next and node_modules locales"
	@echo "  make build        Build Docker image only"
	@echo "  make push         Push image to Docker Hub"
	@echo "  make publish      build + push"
	@echo "  make deploy       fresh + publish"
	@echo "  make ssh          Shell into running container"
	@echo ""

# ------- local dev -------
.PHONY: dev
dev:
	npm run dev

# ------- docker-compose -------
.PHONY: prod
prod:
	$(COMPOSE) up -d --build

.PHONY: down
down:
	$(COMPOSE) down

.PHONY: logs
logs:
	$(COMPOSE) logs -f

.PHONY: ssh
ssh:
	docker exec -it agent.izdrail.com /bin/bash

# ------- Docker-encapsulated Build -------
.PHONY: fresh
fresh:
	@echo "Running fresh build inside Docker for user $(WWWUSER):$(WWWGROUP)..."
	$(COMPOSE) run --rm --user $(WWWUSER):$(WWWGROUP) agent.izdrail.com /bin/bash -c "rm -rf .next node_modules && npm install --legacy-peer-deps && npm run build"

.PHONY: clean
clean:
	rm -rf .next node_modules

# ------- individual steps -------
.PHONY: build
build:
	docker build \
		--build-arg WWWUSER=$(WWWUSER) \
		--build-arg WWWGROUP=$(WWWGROUP) \
		-t $(IMAGE):$(TAG) .

.PHONY: push
push:
	docker push $(IMAGE):$(TAG)

.PHONY: publish
publish: build push
	@echo "Published $(IMAGE):$(TAG)"

.PHONY: deploy
deploy: fresh publish
	@echo "Deployed $(IMAGE):$(TAG)"
