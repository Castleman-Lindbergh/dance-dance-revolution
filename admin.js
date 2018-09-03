
/*
	admin.js: Administrator functionality and routes
*/

var auth = require('./auth.js');
var database = require('./database.js');
var con = database.connection;
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

		// get page with menu to select dance to edit / delete
		app.get('/editDeleteDance', auth.restrictAdmin, function(req, res) {
			// get all dance data from dance table
			database.getAllDances(function(renderDancesObject) {
				// check if there are any dances to modify
				var noDances = renderDancesObject.length == 0;

				// render edit page
				res.render('editdeletedance.html', {
					renderDancesObject:renderDancesObject, 
					noDances: noDances
				});
			});
		});

		// request to delete a dance by uid
		app.post('/deleteDance', auth.isAdmin, function(req, res){
			var danceUID = req.body.uid;

			// attempt to remove dance from db
			database.deleteDance(danceUID, function(err){
				// handle error
				if (err){
					res.render('error.html', { message: "Failed to delete dance. Please try again." });
				} else {
					res.end();
				}
			});
		});

		// get page to edit individual dance
		app.get('/editDance/:uid', auth.restrictAdmin, function(req, res){
			var danceUID = req.params.uid;

			// get individual dance info
			database.getDanceByID(danceUID, function(renderDanceObject){
				// render edit page for this dance
				res.render('editdance.html', { danceEdit: renderDanceObject });
			});
		});

		// request to apply edits to a dance
		app.post('/editDance', auth.isAdmin, function(req, res){
			var danceUID  = req.body.uid;
			var danceName = req.body.name;
			var danceDate = moment(req.body.date);
			var danceVenue = req.body.venue;

			// if valid request
			if (danceUID && danceName && danceDate && danceVenue) {
				// attempt to apply the edits
				database.editDance(danceUID, danceName, danceDate.format('YYYY-MM-DD hh:mm'), danceVenue, function(err){
					// handle error
					if (err){
						res.render('error.html', { message: "Unable to apply edits to this dance. Please try again." });
					} else {
						res.redirect('/editdeletedance');
					}
				});
			} else {
				res.render('error.html', { message: "Please fill out every field." });
			}
		});

		// add new dance to the system
		app.post('/createDance', auth.isAdmin, function(req, res) {
			// protect against empty request
			if (req.body.name && req.body.venue && req.body.date) {
				var date = moment(req.body.date);

				if (date.isValid()) {
					// create new dance entry
					con.query('CALL create_dance(?, ?, ?);', [req.body.name, req.body.venue, date.format('YYYY-MM-DD hh:mm')], function(err, rows) {
						if (!err && rows !== undefined && rows.length > 0 && rows[0].length > 0) {
							// redirect to dance page
							res.redirect('/dance/' + rows[0][0].uid);
						} else {
							// handle error, gracefully I might say
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