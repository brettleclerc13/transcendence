COMPOSE_FILE=docker-compose.yml

PYTHON_PACKAGES = websockets requests asgiref

all: install-deps up

install-deps:
	@echo "Checking and installing required Python packages..."
	@for package in $(PYTHON_PACKAGES); do \
		python3 -c "import $$package" 2>/dev/null || (echo "Installing missing package: $$package" && pip install --user $$package); \
	done

up:
	@mkdir -p ./Volume
	@mkdir -p ./Volume/postgresql
	@mkdir -p ./Backend/media/profile_pictures
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
	rm -Rf ./Backend/authentication/__pycache__
	rm -Rf ./Backend/user/migrations
	rm -Rf ./Backend/user/__pycache__
	rm -Rf ./Backend/tournament/migrations
	rm -Rf ./Backend/tournament/__pycache__
	rm -Rf ./Backend/chat/migrations
	rm -Rf ./Backend/chat/__pycache__
	rm -Rf ./Backend/backend/__pycache__
	rm -Rf ./Backend/utils/__pycache__
	rm -Rf ./Backend/game/migrations
	rm -Rf ./Backend/game/__pycache__
	rm -Rf ./Backend/match/migrations
	rm -Rf ./Backend/match/__pycache__
	rm -Rf ./Backend/tmatch/migrations
	rm -Rf ./Backend/tmatch/__pycache__
	rm -Rf ./Backend/tournament/migrations
	rm -Rf ./Backend/tournament/__pycache__
	rm -Rf ./Backend/chat/migrations
	rm -Rf ./Backend/chat/__pycache__
	rm -Rf ./Backend/media/profile_pictures/*
	mkdir -p ./Volume
	mkdir -p ./Volume/postgresql

re:	
	@mkdir -p ./Volume
	@mkdir -p ./Volume/postgresql
	@mkdir -p ./Backend/media/profile_pictures
	@docker compose -f $(COMPOSE_FILE) build
	@docker compose -f $(COMPOSE_FILE) up 

.PHONY: all up down ps fclean re