
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

		// // get edit an individual dance page
		// app.get('/editDance', auth.restrictAdmin, function(req, res){
		// 	database.getAllDances(function(renderDancesObject){
		// 		res.render('editdance.html', {renderDancesObject:renderDancesObject});
		// 	});
		// });

		// get page with menu to select dance to edit / delete
		app.get('/editDeleteDance', auth.restrictAdmin, function(req, res){
			database.getAllDances(function(renderDancesObject){
				console.log(renderDancesObject);
				var noDances = renderDancesObject.length == 0;
				console.log(noDances);
				res.render('editdeletedance.html', {renderDancesObject:renderDancesObject, noDances: noDances});
			});
		});

		// request to delete a dance by uid
		app.post('/deleteDance', auth.isAdmin, function(req, res){
			var danceUID = req.body.uid;
			database.deleteDance(danceUID, function(err){
				if (err){
					console.log(err);
				} else {
					res.end();
				}
			});
		});

		// get page to edit individual dance
		app.get('/editDance/:uid', auth.restrictAdmin, function(req, res){
			var danceUID = req.params.uid;
			database.getDanceByID(danceUID, function(renderDanceObject){
				console.log(renderDanceObject);
				res.render('editdance.html', {danceEdit:renderDanceObject});
			});
		});

		// request to apply edits to a dance
		app.post('/editDance', auth.isAdmin, function(req, res){
			var danceUID  = req.body.uid;
			var danceName = req.body.name;
			var danceDate = moment(req.body.date);
			var danceVenue = req.body.venue;

			if (danceUID && danceName && danceDate && danceVenue) {
				database.editDance(danceUID, danceName, danceDate.format('YYYY-MM-DD hh:mm'), danceVenue, function(err){
					if (!err){
						res.redirect('/editdeletedance');
					} else {
						console.log(err);
						console.log(danceDate);
					}
				});
			}
		});

		// allow admin to create a new dance
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
							console.log(err);
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