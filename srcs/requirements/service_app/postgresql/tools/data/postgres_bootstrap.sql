/*
-- Create the orders table
create table orders (
	order_id serial primary key,
	customer_id int,
	total float,
	created_at timestamp default now() 
);

-- Populate it with a few values
insert into orders(customer_id, total) values (1,50);
insert into orders(customer_id, total) values (2,100);
insert into orders(customer_id, total) values (2,50);
insert into orders(customer_id, total) values (3,10);
insert into orders(customer_id, total) values (4,90);
*/

/*
-- Create the dbz_public_pong_article table
create table dbz_public_pong_article (
*/

/*
-- Create the pong_article table
create table pong_article (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255),
    contenu TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/
