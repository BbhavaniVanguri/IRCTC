CREATE DATABASE IRCTC;
USE IRCTC;
SHOW DATABASES;
CREATE TABLE booked_traindetails(
pnrnumber VARCHAR(10) PRIMARY KEY NOT NULL,
trainname VARCHAR(30),
source VARCHAR(30),
sourcedatetime VARCHAR(40),
destination VARCHAR(30),
destinationdatetime VARCHAR(40)
-- passengername VARCHAR(40),
-- passengerage INT,
-- passengergender VARCHAR(15),
-- passengerseat VARCHAR(15),
-- passengerstatus VARCHAR(19),
-- passengerseatnumber VARCHAR(10)
);

CREATE TABLE booked_passengerdetails(
pnrnumber1 VARCHAR(10) NOT NULL,
FOREIGN KEY(pnrnumber1) REFERENCES booked_traindetails(pnrnumber),
passengername VARCHAR(40),
passengerage INT,
passengergender VARCHAR(15),
passengerseat VARCHAR(15),
passengerstatus VARCHAR(19),
passengerseatnumber VARCHAR(10)
);

DESCRIBE booked_passengerdetails;
DESCRIBE booked_traindetails;

-- DROP TABLE booked_passengerdetails;
-- DROP TABLE booked_traindetails

SHOW TABLES;

SELECT * FROM booked_passengerdetails;
SELECT * FROM booked_traindetails;


ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
flush privileges;