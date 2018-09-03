
/*
	superadmin.js: Super user functionality
*/

var auth = require('./auth.js');
var con = require('./database.js').connection;

module.exports = {
	init: function(app) {

		// render superadmin portal
		app.get('/superAdminPortal', auth.restrictSuperAdmin, function(req, res) {
			var render = {
				firstName: req.user.name.givenName,
				lastName: req.user.name.familyName,
				userUID: req.user.uid
			};

			res.render('superadminportal.html', render);
		});

		// post an email to authorize a new administrator
		app.post('/authorizeAdmin', auth.isSuperAdmin, function(req, res) {
			if (req.body.email) {
				// ensure that user exists before making admin
				con.query('SELECT uid FROM users WHERE email = ?;', [req.body.email], function(err, rows) {
					if (!err && rows !== undefined && rows.length > 0) {
						// attempt to apply change
						con.query('UPDATE users SET isAdmin = 1 WHERE uid = ?;', [rows[0].uid], function(err) {
							if (!err) {	
								res.render('superadminsuccess.html', { message: "Successfully made \"" + req.body.email + "\" an administrator!" });
							} else {
								res.render('error.html', { message: "Failed to make \"" + req.body.email + "\" an administrator." });
							}
						});
					} else {
						res.render('error.html', { message: "The user you attempt to authorize (\"" + req.body.email + "\") does not exist. Please try a different email." });
					}
				});
			} else {
				res.render('error.html', { message: "Invalid email." });
			}
		});

		// post an email to deauthorize an existing administrator
		app.post('/deauthorizeAdmin', auth.isSuperAdmin, function(req, res) {
			if (req.body.email) {
				// ensure that user exists before deauthorizing
				con.query('SELECT uid FROM users WHERE email = ?;', [req.body.email], function(err, rows) {
					if (!err && rows !== undefined && rows.length > 0) {
						// attempt to apply change
						con.query('UPDATE users SET isAdmin = 0 WHERE uid = ?;', [rows[0].uid], function(err) {
							if (!err) {	
								res.render('superadminsuccess.html', { message: "Successfully removed the administrator privileges from \"" + req.body.email + "\"!" });
							} else {
								res.render('error.html', { message: "Failed to deauthorize \"" + req.body.email + "\"" });
							}
						});
					} else {
						res.render('error.html', { message: "The user you attempt to deauthorize (\"" + req.body.email + "\") does not exist. Please try a different email." });
					}
				});
			}
		});

		return module.exports;
	}
}