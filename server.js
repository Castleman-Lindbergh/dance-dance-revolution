
var express 			= require('express');
var app 				= express();
var mustacheExpress 	= require('mustache-express');
var bodyParser 			= require('body-parser');
var cookieParser 		= require('cookie-parser');
var session 			= require('cookie-session');
var passport 			= require('passport');
var creds				= require('./credentials.js');

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
var user = require('./user.js').init(app);
var superadmin = require('./superadmin.js').init(app);

app.get('/test', function(req, res) {
	res.send(req.user);
});

// fallback redirect to homepage
app.get('*', function(req, res) {
	res.redirect('/');
});

// start server
var server = app.listen(creds.port, function() {
	console.log('Dance Dance Revolution server listening on port %d', server.address().port);
});