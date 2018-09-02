var creds = require('./credentials.js');
var mysql = require('mysql');

module.exports = {
	connection: mysql.createConnection({
	    host: 'localhost',
	    user: creds.MySQL_username,
	    password: creds.MySQL_password,
	    database: 'dancedance'
	}),

	// get students under a given dance with a given status
	searchStudentsByStatus: function(danceUID, status, formattedName, callback) {
		var con = module.exports.connection;

		// determine if searching freely or for a specific person
		var searchByName = formattedName != undefined;

		// get students under this status, with names that match the name query (if searching by name)
		con.query('SELECT friendlyStatuses.name AS status, studentStatuses.lastUpdate, users.firstName, users.lastName FROM studentStatuses JOIN friendlyStatuses ON studentStatuses.status = friendlyStatuses.uid JOIN users ON studentStatuses.userUID = users.uid WHERE studentStatuses.danceUID = ? AND studentStatuses.status = ? AND (users.firstName IN (?) OR users.lastName IN (?) OR ? IS FALSE) ORDER BY studentStatuses.lastUpdate DESC;', [danceUID, status, formattedName, formattedName, searchByName], function(err, studentResults){
			if (!err && studentResults !== undefined){
				callback(studentResults, false);
			} else {
				callback(studentResults, true);
			}
		});
	},

	// get all students who plan to attend a given dance, by uid
	searchStudentsAttendingDance: function(danceUID, status, formattedName, callback) {
		var con = module.exports.connection;

		// determine if searching freely or for a specific person
		var searchByName = formattedName != undefined;

		// get all students currently registered as attending this dance (status > 2)
		con.query('SELECT friendlyStatuses.name AS status, studentStatuses.lastUpdate, users.firstName, users.lastName FROM studentStatuses JOIN friendlyStatuses ON studentStatuses.status = friendlyStatuses.uid JOIN users ON studentStatuses.userUID = users.uid WHERE studentStatuses.danceUID = ? AND studentStatuses.status > 2 AND (users.firstName IN (?) OR users.lastName IN (?) OR ? IS FALSE) ORDER BY studentStatuses.lastUpdate DESC;', [danceUID, formattedName, formattedName, searchByName], function(err, studentResults) {
			if (!err && studentResults !== undefined) {
				callback(studentResults, false);
			} else {
				callback([], true);
			}
		});
	},

	// search for all students under this dance, by name if given
	searchAllStudents: function(danceUID, formattedName, callback) {
		var con = module.exports.connection;

		// determine if searching freely or for a specific person
		var searchByName = formattedName != undefined;

		con.query('SELECT IFNULL(friendlyStatuses.name, "Status unknown") AS status, studentStatuses.lastUpdate, users.firstName, users.lastName FROM users LEFT JOIN studentStatuses ON studentStatuses.userUID = users.uid LEFT JOIN friendlyStatuses ON studentStatuses.status = friendlyStatuses.uid WHERE (studentStatuses.danceUID = ? OR studentStatuses.danceUID IS NULL) AND (users.firstName IN (?) OR users.lastName IN (?)) ORDER BY studentStatuses.lastUpdate DESC;', [danceUID, formattedName, formattedName, searchByName], function(err, studentResults) {
			if (!err && studentResults !== undefined) {
				console.log("Success");
			}

			console.log(studentResults);
			console.log(err);
		});
	},

	// get a render obj filled out with given dance info, and search filters
	getDanceRenderObject: function(danceUID, callback) {
		var con = module.exports.connection;

		// prep render object
		var render = {
			danceUID: danceUID
		};

		// get dance info
		con.query('SELECT * FROM danceTable WHERE uid = ?', [render.danceUID], function(err, danceResults) {
			if (!err && danceResults !== undefined && danceResults.length > 0){
				// add dance info to render obj
				render.dance = danceResults[0];

				// get status names to use as search filters
				con.query('SELECT * FROM friendlyStatuses;', function(err, statuses) {
					if (!err && statuses !== undefined) {
						render.filters = statuses;
					} else {
						render.failedToLoadFilters = true;
					}

					callback(render, false);
				});
			} else {
				callback(render, true);
			}
		});
	}
}