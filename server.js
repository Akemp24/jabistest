const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User'); // Import your User model
const authController = require('./controllers/authController'); // Import your authentication controller
const path = require('path');
const signupController = require('./controllers/signupController');
const bodyParser = require('body-parser');


const app = express();
const port = 4001;

// Create an instance of Handlebars engine
const hbs = exphbs.create({
  /* Specify any Handlebars configuration here */
});

// Configure Handlebars as the template engine
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// Set the views directory
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Parse incoming request bodies in a middleware before your routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route to render the homepage.handlebars template
app.get("/", (req, res) => {
  res.render("homepage", {layout: "main"});
});

// Route to render the signup.handlebars template
app.get("/signup", (req, res) => {
  res.render("signup", {layout: "main"});
});

// Route to render the login.handlebars template
app.get("/login", (req, res) => {
  res.render("login", {layout: "main"});
});

// express session setup
app.use(session({
  secret: process.env.secretKey,
  resave: false,
  saveUninitialized: false,
}));

// passport middleware
app.use(passport.initialize());
app.use(passport.session());

// PassportConfiguration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// authentication routes
// app.post('/login', authController.login);
// app.get('/logout', authController.logout);

// Handle signup form submission using the new signup controller
app.post('/signup', signupController.signup);

// Handle logging in
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Error during authentication:', err);
      return next(err);
    }
    if (!user) {
      console.log('Login failed:', info.message);
      return res.redirect('/login');
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('Error during login:', err);
        return next(err);
      }
      console.log('Login successful:', user.username);
      return res.redirect('/');
    });
  })(req, res, next);
});

// Sync the User model with the database
User.sync()
  .then(() => {
    console.log('User model synced with database.');
    // Start the server after the database connection is established
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error syncing User model:', err);
  });
