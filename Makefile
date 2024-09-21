.PHONY: all clean fclean re

all:

	@if [ ! -d "./volume/smart_contract" ]; then \
		sudo mkdir -p "./volume/smart_contract"; \
	fi

	@if [ ! -d "./volume/django_web_app" ]; then \
		sudo mkdir -p "./volume/django_web_app"; \
	fi

	@if [ ! -d "./volume/static" ]; then \
		sudo mkdir -p "./volume/static"; \
	fi

	@if [ ! -d "./volume/postgresql" ]; then \
		sudo mkdir -p "./volume/postgresql"; \
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
