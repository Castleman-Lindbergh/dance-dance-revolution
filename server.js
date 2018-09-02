
var express 			= require('express');
var app 				= express();
var mustacheExpress 	= require('mustache-express');
var bodyParser 			= require('body-parser');
var cookieParser 		= require('cookie-parser');
var session 			= require('cookie-session');
var passport 			= require('passport');
var moment				= require('moment');
var creds				= require('./credentials.js');
var  database			= require('./database.js');
var  con 				= database.connection;

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.engine('html', mustacheExpress());
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));

// configure session
app.use(session({ 
	secret: creds.SESSION_SECRET,
	name: 'session',
	resave: true,
	saveUninitialized: true
}));


var auth = require('./auth.js').init(app, passport);
var admin = require('./admin.js').init(app);

// start server
var server = app.listen(8080, function() {
	console.log('Dance Dance Revolution server listening on port %d', server.address().port);
});

// render homepage
app.get('/', auth.restrictAuth, function(req, res) {
	var render = {};

	// get active dance info
	con.query('SELECT * FROM danceTable WHERE danceTime >= NOW();', function(err, rows) {
		if (!err && rows !== undefined && rows.length > 0) {
			// add dance info to render object
			render.dances = rows;

			for (var i = 0; i < render.dances.length; i++) {
				var d = render.dances[i];

				// format date
				d.danceTime = moment(d.danceTime).format('dddd, MMMM Do YYYY');
			}
			
			// render page
			res.render('homepage.html', render);
		} else {
			res.render('error.html', { message: "Failed to get dance info." });
		}
	});
});

// get individual dance info by uid
app.get('/dance/:id', function(req, res) {
	// prep render object
	var render = {
		danceUID: req.params.id
	};

	// get dance info
	con.query('SELECT * FROM danceTable WHERE uid = ?', [render.danceUID], function(err, danceResults) {
		if (!err && danceResults !== undefined && danceResults.length > 0){

			render.dance = danceResults[0];

			// get all students currently registered as attending this dance (status > 2)
			con.query('SELECT friendlyStatuses.name AS status, studentStatuses.lastUpdate, users.firstName, users.lastName FROM studentStatuses JOIN friendlyStatuses ON studentStatuses.status = friendlyStatuses.uid JOIN users ON studentStatuses.userUID = users.uid WHERE studentStatuses.danceUID = ? AND studentStatuses.status > 2 ORDER BY studentStatuses.lastUpdate DESC;', [render.danceUID], function(err, studentResults){
				if (!err && studentResults !== undefined){
					render.students = studentResults;
				}

				res.render('dancepage.html', render);
			});
		} else {
			res.render('error.html', { message: "Unable to retrieve dance data." });
		}
	});
});

// // search for students under a given dance event
// app.post('/dance/:id', function(req,res){
// 	var danceUID = req.params.id;
// 	var render = {};

// 	// get dance page info
// 	con.query('SELECT * FROM danceTable WHERE uid = ?;', [danceUID], function(err, danceResults) {
// 		if (!err && danceResults !== undefined && danceResults.length > 0) {
// 			render.dance = danceResults[0];
// 		}

// 		// determine filter
// 		var filter = "1 = 1";
// 		if (req.body.filter == "0") {
// 			filter = "studentStatuses.status > 2";
// 		} else if (req.body.filter == "1") {
// 			filter = "studentStatuses.status = 2";
// 		} else if (req.body.filter == "2") {
// 			filter = "studentStatuses.status = 4";
// 		}

// 		if (req.body.studentName == "") {
// 			con.query('SELECT friendlyStatuses.name AS status, studentStatuses.lastUpdate, users.firstName, users.lastName FROM studentStatuses JOIN friendlyStatuses ON studentStatuses.status = friendlyStatuses.uid JOIN users ON studentStatuses.userUID = users.uid WHERE studentStatuses.danceUID = ? AND ' + filter + ' ORDER BY studentStatuses.lastUpdate DESC;', [danceUID], function(err, rows) {
// 				if (!err && rows !== undefined && rows.length > 0) {
// 					render.students = rows;
// 				}

// 				res.render('dancepage.html', render);
// 			});
// 		} else {
// 			res.end();
// 		}
// 	});
// });

// fallback redirect to homepage
app.get('*', function(req, res) {
	res.redirect('/');
});