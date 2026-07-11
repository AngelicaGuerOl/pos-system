.PHONY: dev up build ps logs down restart-frontend

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db pgadmin
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --no-deps frontend

up:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

build:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build

ps:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

logs:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

restart-frontend:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --force-recreate frontend
