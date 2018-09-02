
var express 			= require('express');
var app 				= express();
var mustacheExpress 	= require('mustache-express');
var bodyParser 			= require('body-parser');
var cookieParser 		= require('cookie-parser');
var session 			= require('cookie-session');
var passport 			= require('passport');
var moment				= require('moment');
var creds				= require('./credentials.js');
var database			= require('./database.js');
var con 				= database.connection;

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

// import local modules
var auth = require('./auth.js').init(app, passport);
var admin = require('./admin.js').init(app);

// start server
var server = app.listen(8080, function() {
	console.log('Dance Dance Revolution server listening on port %d', server.address().port);
});

// send homepage with upcoming dances at root page
app.get('/', auth.restrictAuth, function(req, res) {
	var render = {};

	// get active dance info
	con.query('SELECT * FROM danceTable WHERE danceTime >= NOW();', function(err, rows) {
		if (!err && rows !== undefined && rows.length > 0) {
			// add dance info to render object
			render.dances = rows;

			// convert each active dance's date into a more readable format
			for (var i = 0; i < render.dances.length; i++) {
				var d = render.dances[i];
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
app.get('/dance/:id', auth.restrictAuth, function(req, res) {
	// get default dance page render object
	database.getDanceRenderObject(req.params.id, function(render, err) {
		if (!err) {
			// get student info for those planning to attend
			database.searchStudentsAttendingDance(render.danceUID, function(students, err) {
				render.students = students;
				res.render('dancepage.html', render);
			});
		} else {
			res.render('error.html', { message: "Unable to retrieve information for the requested dance." });
		}
	});
});

// field a search under a given dance
app.post('/dance/:id', auth.isAuthenticated, function(req, res) {
	var name;

	// setup dance page render object
	database.getDanceRenderObject(req.params.id, function(render, err) {
		if (!err) {
			res.render('dancepage.html', render);

			console.log(req.body);
			console.log("Under dance ID " + req.params.id);

			if (req.body.studentName != "") {
				name = parseName(req.body.studentName);
			}

			// attempt to parse filter
			var filter = parseInt(req.params.id, 10);
			if (isNaN(filter) || filter < -1) {
				filter = -1;	// default to "All Students"
			}

			// if searching for a given status
			if (filter > 0) {
				database.searchStudentsByStatus(req.params.id, filter, name, function(students, err) {

				});
			} else if (filter == 0) {
				// searching for "Attending"
				database.searchStudentsAttendingDance(req.params.id, filter, name, function(students, err) {
					
				});
			} else if (filter == -1) {
				// searching for "All Students"
				database.searchAllStudents(req.params.id, name, function(students, err) {
					
				});
			}
		} else {
			res.render('error.html', { message: "Unable to retrieve information for the requested dance." });
		}
	});
});

database.searchAllStudents(1, "'Thomas'", function(students, err) {
	console.log(students);
	console.log(err);
});

// DEBUG AHH
function parseName(name) {
	return name;
}

// fallback redirect to homepage
app.get('*', function(req, res) {
	res.redirect('/');
});