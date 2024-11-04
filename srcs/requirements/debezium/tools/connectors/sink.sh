#!/bin/sh

curl -sf -H 'Content-Type: application/json' debezium:8083/connectors --data '{
  "name": "postgres-sink-connector",
  "config": {
    "connector.class": "io.debezium.connector.jdbc.JdbcSinkConnector",
    "tasks.max": "1",
    "connection.url": "jdbc:postgresql://service_app_postgresql:5432/pandashop",
    "connection.username": "postgresuser",
    "connection.password": "postgrespw",
    "insert.mode": "upsert",
    "delete.enabled": "true",
    "primary.key.mode": "record_key",
    "schema.evolution": "basic",
    "database.time_zone": "UTC",
    "topics": "dbz.public.pong_article"
  }
}' \
&& echo -e "\n" \
