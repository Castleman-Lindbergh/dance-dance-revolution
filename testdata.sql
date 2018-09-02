
SOURCE create_db.sql;

INSERT INTO danceTable (name, danceTime, venue, attendanceCount) VALUES
	("Dance 1", "2018-10-4", "in the Randolph Hall Commons", 10),
	("Dance 2", "2018-12-14", "in the Dining Hall", 12),
	("Dance 3", "2018-02-28", "Somewhere", 2),
	("Dance 4", "2019-03-14", "in the SAC", 8);


INSERT INTO users (firstName, lastName) VALUES ("Teddy", "Roosevelt"), ("Testing", "Person"), ("User", "lastname"), ("Tommy", "Boy");


INSERT INTO studentStatuses (danceUID, userUID, status, lastUpdate) VALUES 
	(1, 1, 3, NOW()),
	(1, 3, 2, NOW()),
	(1, 2, 4, NOW()),
	(2, 2, 5, NOW());