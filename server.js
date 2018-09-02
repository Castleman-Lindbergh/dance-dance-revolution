
var express 			= require('express');
var app 				= express();
var mustacheExpress 	= require('mustache-express');
var bodyParser 			= require('body-parser');
var cookieParser 		= require('cookie-parser');
var session 			= require('cookie-session');
var passport 			= require('passport');
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

// start server
var server = app.listen(8080, function() {
	console.log('Dance Dance Revolution server listening on port %d', server.address().port);
});

// render homepage
app.get('/', auth.restrictAuth, function(req, res) {
	res.render('homepage.html');
});

// render dance page for a given dance
// app.get('/dance/:id', auth.restrictAuth, function(req, res) {

// });

// debug
app.get('/test', function(req, res) {
	res.send(req.user);
});

app.post('/studentFilter/:studentUID', function(req,res){
	var studentUID = req.params.studentUID;
	res.send("the shit you requested")

})

app.get('/dance/:id', function(req, res){
	var danceUID =  req.params.id;
	con.query('SELECT * FROM danceTable where uid = ?', [danceUID], function(err,danceResults){
		console.log(danceResults);
		if (!err && danceResults !== undefined){
			con.query('SELECT studentStatuses.status, studentStatuses.lastUpdate, users.firstname, users.lastname FROM studentStatuses JOIN users ON studentStatuses.uid = users.uid where studentStatuses.danceUID = ?;',[danceUID], function(err, studentResults){
				if (!err && studentResults !== undefined){
					res.render('dancepage.html',{
						uid_dance:danceUID,
						dance:danceResults[0],
						students:studentResults
					});
				}
			});
			
		}
	});
	

});

// fallback redirect to homepage
app.get('*', function(req, res) {
	res.redirect('/');
});