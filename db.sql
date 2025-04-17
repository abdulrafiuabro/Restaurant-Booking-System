CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE employee_mapping (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    restaurant_id INT REFERENCES restaurant(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branch(id) ON DELETE CASCADE
);

CREATE TABLE restaurant (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(255),
    cuisine_id INT REFERENCES cuisine(id) ON DELETE SET NULL,
    description TEXT
);


CREATE TABLE cuisine (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE branch (
    id SERIAL PRIMARY KEY,
    restaurant_id INT REFERENCES restaurant(id) ON DELETE CASCADE,
    city VARCHAR(255),
    country VARCHAR(255),
    address TEXT,
    location VARCHAR(255)
);

CREATE TABLE "table" (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branch(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    max_capacity INT,
    is_side_table BOOLEAN DEFAULT FALSE,
    is_open_space BOOLEAN DEFAULT FALSE,
    floor INT
);

CREATE TABLE booking (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    table_id INT REFERENCES "table"(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    special_requests TEXT,
    status VARCHAR(50) NOT NULL
);
