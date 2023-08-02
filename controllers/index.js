const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

// configure passport
passport.use(new LocalStrategy(
    // lets us customize the error
    { failWithError: true },
    function (username, password, done) {
        // logic for authentication. Making sure the username and password is correct.
        User.findByUsername(username, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, { message: 'Incorrect username or password' });
            }
            User.verifyPassword(password, function (err, isMatch) {
                if (err) {
                    return done(err);
                }
                if (!isMatch) {
                    return done(null, false, { message: 'Incorrect username or password' });
                }
                return done(null, user);
            });
        });
    }
));

// serialize and deserialize the User
// serialize stores the user ID in the session
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
// deserialize retrieves user info based on the user ID stored in the session
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

// export the login and logout functions as well as the middle ware
// makes sure routes are protected with the ensureAuthenticated action
// may reorganize?
module.exports = {
    login: function (req, res, next) {
        // middleware
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json(info)
            }
            req.login(user, function (err) {
                if (err) {
                    return next(err);
                }
                return res.json({ message: 'Login successful', user });
            });
        })(req, res, next);
    },

    logout: function (req, res) {
        req.logout();
        res.json({ message: 'Logout successful' });
    },

    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ message: 'Authentication required' });
    },

    register: function (req, res) {
        const { username, password } = req.body;
        User.register(new User({ username }), password, function (err, user) {
            if (err) {
                return res.status(400).json({ message: 'Failed to register user', error: err.message });
            }
            res.json({ message: 'Registration successful', user });
        });
    }
};