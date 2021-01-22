const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const {getUserByEmail} = require('./helpers');
const {urlsForUser} = require('./helpers');
const {generateRandomString} = require('./helpers');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;
/*
Table of contents (use control + f to jump to each header)
order for reading: table number, line number of title/where section starts, title
1) line 19 - Middleware + Server setup
2) line 31 - Objects for reference/future database
3) line 54 - Post Handlers/Endpoints
4) line 119 - Get handlers/endpoints
5) line 140 - Page renderers
*/
//---------------------------------------------------Middleware + Server setup---------------------------------------------------------------------------


app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'tiny hello',
  keys: ['why-bother']
}));
app.set("view engine", "ejs");
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
//---------------------------------------------------Objects for reference/future database----------------------------------------------------------------

//mock database to hold all created urls, along with their long url and creator
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

//mock database to hold all users and relevant information
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk",10)
  }
};


//---------------------------------------------------Post Handlers/Endpoints ---------------------------------------------------------------------------

//endpoint for new users to register, checks for empty fields and whether email already exists for a user, generates new user and adds to database
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    return res.sendStatus(400);
  }
  if (getUserByEmail(req.body.email, users)) {
    return res.sendStatus(400);
  }
  const short = generateRandomString();
  users[short] = {
    id: short,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.userId = short;
  res.redirect("/urls");
});

//endpoint for users to login, if already logged in redirects to urls page
app.post("/login", (req, res) => {
  if (!getUserByEmail(req.body.email, users)) {
    return res.sendStatus(403);
  }
  if (!bcrypt.compareSync(req.body.password, getUserByEmail(req.body.email, users).password)) {
    return res.sendStatus(403);
  }
  req.session.userId = getUserByEmail(req.body.email, users).id;
  res.redirect("/urls");
});

//endpoint for users to generate new shortURLS which are added to the database and tied to the user who created them
app.post("/urls", (req, res) => {
  const short = generateRandomString();
  urlDatabase[short] = { longURL: req.body.longURL, userID: req.session.userId };
  res.redirect(`/urls/${short}`);
});

//endpoint for users to log out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//endpoint for users to edit only their longURLS
app.put("/urls/:shortURL", (req, res) => {
  if (req.session.userId === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.send("you can only modify or delete URLs you've created");
  }
});
  
//endpoint for users to delete their short URLs
app.delete("/urls/:shortURL", (req, res) => {
  if (req.session.userId === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.Status(404).send("you can only modify or delete URLs you've created");
  }
});
  
//---------------------------------------------------Get handlers/endpoints---------------------------------------------------------------------------
  
//endpoint for root directory, sends to urls page if logged in or to login page otherwise
app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});
  
//endpoint for any user to use a generated shortURL if it exists
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.sendStatus(404);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


//---------------------------------------------------Page renderers---------------------------------------------------------------------------
  
//render login page when user attempts to login, or redirect to urls if already logged in
app.get("/login", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/urls");
  }
  const templateVars = { urls: urlDatabase, user: users[req.session.userId] };
  res.render("urls_login", templateVars);
});

//render /urls page with relevant information passed
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.session.userId, urlDatabase), user: users[req.session.userId] };
  res.render("urls_index", templateVars);
});

//render page for entering new URLs to be shortened, only if the user is logged in
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase, user: users[req.session.userId]
  };
  if (!users[req.session.userId]) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//render page for new users to register
app.get("/register", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/urls");
  }
  const templateVars = { urls: urlDatabase, user: users[req.session.userId]};
  res.render("urls_register", templateVars);
});

//render show page for shortURL to longURL, if user exists and the requested data exists in our database and if the user was the creator of that url
app.get("/urls/:shortURL", (req, res) => {
  if (!users[req.session.userId]) {
    return res.sendStatus(404);
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.sendStatus(404);
  }
  if (users[req.session.userId].id !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(403);
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.userId]};
  res.render("urls_show", templateVars);
});

//endpoint to handle any mistyped or non-existant page
app.get("*", (req, res) => {
  res.Status(404).send("Page does not exist");
});