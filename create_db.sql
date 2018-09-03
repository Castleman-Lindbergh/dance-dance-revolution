
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

-- friendly status names
CREATE TABLE friendlyStatuses (
	uid INT NOT NULL AUTO_INCREMENT,
	name VARCHAR(32), 
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

-- users who can designate and remove other admins
CREATE TABLE superAdmins (
	uid INT NOT NULL AUTO_INCREMENT,
	firstName VARCHAR(32),
	lastName VARCHAR(32),
	email VARCHAR(64),
	PRIMARY KEY (uid)
);

-- links between students and dances, recording status
CREATE TABLE studentStatuses (
	uid INT NOT NULL AUTO_INCREMENT,
	danceUID INT,
	userUID INT,
	status INT,
	lastUpdate DATETIME,
	PRIMARY KEY (uid),
	FOREIGN KEY (status) REFERENCES friendlyStatuses(uid),
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

-- enter a new status or update a previously existing one
CREATE PROCEDURE updateStatus(IN _danceUID INT, IN _userUID INT, IN _status INT)
BEGIN
	IF (_status = 1) THEN
		DELETE FROM studentStatuses WHERE danceUID = _danceUID AND userUID = _userUID;
	ELSE 
		IF EXISTS (SELECT * FROM studentStatuses WHERE danceUID = _danceUID AND userUID = _userUID) THEN
			UPDATE studentStatuses SET status = _status, lastUpdate = NOW() WHERE danceUID = _danceUID AND userUID = _userUID;
		ELSE 
			INSERT INTO studentStatuses (danceUID, userUID, status, lastUpdate) VALUES (_danceUID, _userUID, _status, NOW());
		END IF;
	END IF;
END;
//;

DELIMITER ;

-- insert status names
INSERT INTO friendlyStatuses (name) VALUES
	/* status 1 */ ("Status unknown"),
	/* status 2 */ ("Not attending"),
	/* status 3 */ ("Has a date"),
	/* status 4 */ ("Seeking a date"),
	/* status 5 */ ("Not seeking a date"),
	/* status 6 */ ("Not opposed to having a date");