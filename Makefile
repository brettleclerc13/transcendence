COMPOSE_FILE=docker-compose.yml

all: up

up:
	@mkdir -p ./Volume
	@mkdir -p ./Volume/postgresql
	docker compose -f $(COMPOSE_FILE) up 

down:
	docker compose -f $(COMPOSE_FILE) down

ps:
	@docker compose -f $(COMPOSE_FILE) ps

fclean: down
	@docker rmi -f $$(docker images -qa);\
	docker volume rm $$(docker volume ls -q);\
	docker system prune -a --force
	rm -Rf ./Volume
	mkdir -p ./Volume
	mkdir -p ./Volume/postgresql

re:	
	@mkdir -p ./Volume
	@mkdir -p ./Volume/postgresql
	@docker compose -f $(COMPOSE_FILE) build
	@docker compose -f $(COMPOSE_FILE) up 

.PHONY: all up down ps fclean re