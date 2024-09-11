.PHONY: all clean fclean re

all:
	@if [ ! -d "/home/volume" ]; then \
		sudo mkdir -p "/home/volume"; \
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
