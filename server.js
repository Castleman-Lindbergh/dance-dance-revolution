
var express 			= require('express');
var app 				= express();
var mustacheExpress 	= require('mustache-express');
var bodyParser 			= require('body-parser');
var cookieParser 		= require('cookie-parser');
var session 			= require('cookie-session');
var passport 			= require('passport');
var moment				= require('moment');
var creds				= require('./credentials.js');
var con					= require('./database.js').connection;

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

// render dance page for a given dance
app.get('/dance/:id', auth.restrictAuth, function(req, res) {
	res.render('dancepage.html');
});

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
		// create new dance entry
		con.query('CALL create_dance(?, ?, ?);', [req.body.name, req.body.venue, req.body.date], function(err, rows) {
			if (!err && rows !== undefined && rows.length > 0 && rows[0].length > 0) {
				// redirect to dance page
				res.redirect('/dance/' + rows[0][0].uid);
			} else {
				res.render('error.html', { message: "Unable to create dance." });
			}
		});
	}
});

// fallback redirect to homepage
app.get('*', function(req, res) {
	res.redirect('/');
});