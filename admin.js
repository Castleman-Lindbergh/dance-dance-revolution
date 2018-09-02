
/*
	admin.js: Administrator functionality and routes
*/

var auth = require('./auth.js');
var con = require('./database.js').connection;
var moment = require('moment');


module.exports = {
	// initialize routes
	init: function(app) {

		// get administrator portal
		app.get('/admin', auth.restrictAdmin, function(req, res) {
			res.render('admin.html');
		});

		// get form for creating new dance
		app.get('/createDance', auth.restrictAdmin, function(req, res) {
			res.render('createdance.html');
		});

		// allow admin to create a new dance
		app.post('/createDance', auth.isAdmin, function(req, res) {
			// protect against empty request
			if (req.body.name && req.body.venue && req.body.date) {
				var date = moment(req.body.date);

				if (date.isValid()) {
					// create new dance entry
					con.query('CALL create_dance(?, ?, ?);', [req.body.name, req.body.venue, date], function(err, rows) {
						if (!err && rows !== undefined && rows.length > 0 && rows[0].length > 0) {
							// redirect to dance page
							res.redirect('/dance/' + rows[0][0].uid);
						} else {
							res.render('error.html', { message: "Unable to create dance." });
						}
					});
				} else {
					res.render('error.html', { message: "Invalid date \"" + req.body.date + "\" given for new dance." });
				}
			} else {
				res.render('error.html', { message: "Invalid parameters for new dance." });
			}
		});

		return module.exports;
	}
}