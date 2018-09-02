
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
	var render = {
		isAdmin: req.user.isAdmin,
		myName: req.user.name.givenName
	};

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
	database.getDanceRenderObject(req.user, req.params.id, null, function(render, err) {
		if (!err) {
			render.selectAttending = true;

			// get student info for those planning to attend
			database.searchStudentsAttendingDance(render.danceUID, null, function(students, err) {
				render.students = students;
				render.hasResults = students.length > 0;
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

	// attempt to parse filter
	var filter = parseInt(req.body.filter, 10);
	if (isNaN(filter) || filter < -1) {
		filter = -1;	// default to "All Students"
	}

	// setup dance page render object
	database.getDanceRenderObject(req.user, req.params.id, filter, function(render, err) {
		if (!err) {

			// parse name query
			if (req.body.studentName != "") {
				name = parseName(req.body.studentName);
			}

			// record name search in render object
			render.studentName = req.body.studentName;

			// if searching for a given status
			if (filter > 0) {
				// search for students under only that status
				database.searchStudentsByStatus(req.params.id, filter, name, function(students, err) {
					if (!err) {
						render.students = students;
						render.hasResults = students.length > 0;
						res.render('dancepage.html', render);
					} else {
						res.render('error.html', { message: "Failed to search for students by status." });
					}
				});
			} else if (filter == 0) {
				render.selectAttending = true;	// register which filter is selected in UI

				// searching for "Attending"
				database.searchStudentsAttendingDance(req.params.id, name, function(students, err) {
					if (!err) {
						render.students = students;
						render.hasResults = students.length > 0;
						res.render('dancepage.html', render);
					} else {
						res.render('error.html', { message: "Failed to search for attending students." });
					}
				});
			} else if (filter == -1) {
				render.selectAll = true;	// register which filter is selected in UI

				// searching for "All Students"
				database.searchAllStudents(req.params.id, name, function(students, err) {
					if (!err) {
						render.students = students;
						render.hasResults = students.length > 0;
						res.render('dancepage.html', render);
					} else {
						res.render('error.html', { message: "Failed to search students." });
					}
				});
			}
		} else {
			res.render('error.html', { message: "Unable to retrieve information for the requested dance." });
		}
	});
});

// parse a name into a format that can be prepared into a statement
function parseName(name) {
	return name.split(' ');
}

// allow user to update their status relative to a dance
app.post('/defineStatus/:id', auth.isAuthenticated, function(req, res) {
	var danceUID = parseInt(req.params.id, 10);
	var status = parseInt(req.body.status, 10);

	if (!isNaN(danceUID) && !isNaN(status)) {
		// enter a new status relation into db
		database.createNewStudentStatus(danceUID, req.user.uid, status, function(err) {
			if (err) {
				res.render('error.html', { message: "Unable to update status." });
			} else {
				res.redirect('/dance/' + danceUID);
			}
		});
	} else {
		res.redirect('/');
	}
});

// fallback redirect to homepage
app.get('*', function(req, res) {
	res.redirect('/');
});