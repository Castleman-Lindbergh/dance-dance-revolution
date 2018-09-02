
/* 
	auth.js: Authentication routes / configurations and middleware for restricting pages / requests to various levels of authentication
*/

var GoogleStrategy = require('passport-google-oauth2').Strategy;
var querystring = require('querystring');
var con = require('./database.js').connection;
var creds = require('./credentials.js');

module.exports = {

	// set up routes and configure authentication settings
	init: function(app, passport) {

		// cache user info from our system into their session
		passport.serializeUser(function(user, done) {
			// check for existing user within the system
			con.query('SELECT uid, isAdmin FROM users WHERE email = ?;', [user.email], function(err, rows) {
				if (!err && rows !== undefined && rows.length > 0) {
					// cache user uid
					user.uid = rows[0].uid;
					user.isAdmin = rows[0].isAdmin;
					done(null, user);
				} else {
					// assume no existing user, add to system
					con.query('CALL create_user(?, ?, ?);', [user.email, user.name.givenName, user.name.familyName], function(err, rows) {
						if (!err && rows !== undefined && rows.length > 0 && rows[0].length > 0) {
							// cache system uid in session
							user.uid = rows[0][0].uid;
							user.isAdmin = rows[0][0].isAdmin;
							done(null, user);
						} else {
							done('There was an error signing you in.', null);
						}
					})
				}
			});
		});

		passport.deserializeUser(function(user, done) {
			done(null, user);
		});

		// Google OAuth2 config with passport
		passport.use(new GoogleStrategy({
				clientID:		creds.GOOGLE_CLIENT_ID,
				clientSecret:	creds.GOOGLE_CLIENT_SECRET,
				callbackURL:	creds.domain + "/auth/google/callback",
				passReqToCallback: true
			},
			function(request, accessToken, refreshToken, profile, done) {
				process.nextTick(function () {
					return done(null, profile);
				});
			}
		));

		app.use(passport.initialize());
		app.use(passport.session());

		// authentication with google endpoint
		app.get('/auth/google', passport.authenticate('google', { scope: [
				'https://www.googleapis.com/auth/userinfo.profile',
				'https://www.googleapis.com/auth/userinfo.email'
			]
		}));

		// callback for google auth
		app.get('/auth/google/callback',
			passport.authenticate('google', {
				successReturnToOrRedirect: '/',
				failureRedirect: '/failure'
		}));

		// handler for failure to authenticate
		app.get('/failure', function(req, res) {
			res.send('Auth Failure');
		});

		// logout handler
		app.get('/logout', function(req, res){
			req.logout();
			res.redirect('/');
		});

		return module.exports;
	},

	// middleware to restrict pages to authenticated users
	restrictAuth: function(req, res, next) {
		// if authenticated and has session data from our system
		if (req.isAuthenticated() && req.user.uid) {
			return next();
		} else {
			res.redirect('/auth/google?returnTo=' + querystring.escape(req.url));
		}
	},

	// middleware to restrict pages to admin users
	restrictAdmin: function(req, res, next) {
		// if authenticated and has session data
		if (req.isAuthenticated() && req.user.uid) {
			// if administrator, allow
			if (req.user.isAdmin) {
				return next();
			} else {
				res.redirect('/');
			}
		} else {
			res.redirect('/auth/google?returnTo=' + querystring.escape(req.url));
		}
	},

	// middleware (for POST reqs) to check if auth'd
	isAuthenticated: function(req, res, next) {
		if (req.isAuthenticated() && req.user.uid) {
			return next();
		} else {
			res.redirect('/');
		}
	},

	// middleware (for POSTs) to check if requester is admin
	isAdmin: function(req, res, next) {
		if (req.isAuthenticated() && req.user.uid && req.user.isAdmin == 1) {
			return next();
		} else {
			res.redirect('/');
		}
	}
}