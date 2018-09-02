
DROP DATABASE IF EXISTS dancedance;
CREATE DATABASE dancedance;

USE dancedance;

-- records all dance event info
CREATE TABLE danceTable (
	uid INT NOT NULL AUTO_INCREMENT,
	name VARCHAR(32),
	danceTime DATETIME,
	venue VARCHAR(64),
	attendanceCount INT DEFAULT 0,
	PRIMARY KEY (uid)
);

-- all user info
CREATE TABLE users (
	uid INT NOT NULL AUTO_INCREMENT,
	firstName VARCHAR(32),
	lastName VARCHAR(32),
	email VARCHAR(64),
	isAdmin TINYINT(1) DEFAULT 0,
	PRIMARY KEY (uid)
);

-- links between students and dances, recording status
CREATE TABLE studentStatuses (
	uid INT NOT NULL AUTO_INCREMENT,
	danceUID INT,
	userUID INT,
	status TINYINT(5),
	lastUpdate DATETIME,
	PRIMARY KEY (uid),
	FOREIGN KEY (danceUID) REFERENCES danceTable(uid) ON DELETE CASCADE,
	FOREIGN KEY (userUID) REFERENCES users(uid) ON DELETE CASCADE
);

-- links between students and dances for dances NOT CURRENTLY ACTIVE
CREATE TABLE studentStatusesHistory LIKE studentStatuses;

-- add new user and return their information
DELIMITER //;
CREATE PROCEDURE create_user (IN userEmail VARCHAR(64), IN userFirst VARCHAR(32), IN userLast VARCHAR(32))
BEGIN
	INSERT INTO users (email, firstName, lastName) VALUES (userEmail, userFirst, userLast);
	SELECT uid, isAdmin FROM users WHERE uid = LAST_INSERT_ID();
END;
//;

-- add new dance, get its id
CREATE PROCEDURE create_dance (IN danceName VARCHAR(32), IN danceVenue VARCHAR(64), IN dancetime VARCHAR(32))
BEGIN
	INSERT INTO danceTable (name, venue, danceTime) VALUES (danceName, danceVenue, dancetime);
	SELECT LAST_INSERT_ID() AS uid;
END;
//;
DELIMITER ;