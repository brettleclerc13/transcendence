.PHONY: all clean fclean re

all:

	@if [ ! -d "./volume/smart_contract" ]; then \
		sudo mkdir -p "./volume/smart_contract"; \
	fi

	@if [ ! -d "./volume/nextjs" ]; then \
		sudo mkdir -p "./volume/nextjs"; \
	fi

	@if [ ! -d "./volume/static/static_service_app" ]; then \
		sudo mkdir -p "./volume/static/static_service_app"; \
	fi

	@if [ ! -d "./volume/service_app/django" ]; then \
		sudo mkdir -p "./volume/service_app/django"; \
	fi

	@if [ ! -d "./volume/service_app/postgresql" ]; then \
		sudo mkdir -p "./volume/service_app/postgresql"; \
	fi

	@if [ ! -d "./volume/static/static_service_chat" ]; then \
		sudo mkdir -p "./volume/static/static_service_chat"; \
	fi

	@if [ ! -d "./volume/service_chat/django" ]; then \
		sudo mkdir -p "./volume/service_chat/django"; \
	fi

	@if [ ! -d "./volume/service_chat/postgresql" ]; then \
		sudo mkdir -p "./volume/service_chat/postgresql"; \
	fi

	@sudo docker compose -f ./srcs/docker-compose.yml up -d --build

clean:

	@sudo docker compose -f ./srcs/docker-compose.yml down

fclean: clean

	@if [ $$(sudo docker images -qa | wc -l) -ne 0 ]; then \
		sudo docker rmi -f $(shell sudo docker images -qa); \
	fi

	@if [ $$(sudo docker network ls -q | wc -l) -ne 0 ]; then \
		sudo docker network prune -f; \
	fi

	@if [ $$(sudo docker volume ls -q | wc -l) -ne 0 ]; then \
		sudo docker volume rm -f $(shell sudo docker volume ls -q); \
	fi

re: fclean all
