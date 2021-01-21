const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const {getUserByEmail} = require('./helpers');
const {urlsForUser} = require('./helpers');
const {generateRandomString} = require('./helpers');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

//---------------------------------------------------Middleware---------------------------------------------------------------------------


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'tiny hello',
  keys: ['why-bother']
}));
app.set("view engine", "ejs");
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
//---------------------------------------------------Objects for reference/future database----------------------------------------------------------------

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

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


//---------------------------------------------------Post Handlers ---------------------------------------------------------------------------

//handler for new users to register, adding to our users object
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
  req.session.user_id = short;
  console.log(urlDatabase[short]);
  res.redirect("/urls");
});

//add post function to handle users logging in
app.post("/login", (req, res) => {
  if (!getUserByEmail(req.body.email, users)) {
    console.log("email doesn't exist");
    return res.sendStatus(403);
  }
  if (!bcrypt.compareSync(req.body.password, getUserByEmail(req.body.email, users).password)) {
    console.log("password didn't match");
    return res.sendStatus(403);
  }
  //res.cookie('user_id', getUserByEmail(req.body.email).id);
  req.session.user_id = getUserByEmail(req.body.email, users).id;
  res.redirect("/urls");
});
//

//   if (!getUserByEmail(req.body.email)) {
//     console.log("email didn't register")
//     res.sendStatus(403);
//   } else if (bcrypt.compareSync(req.body.password, getUserByEmail(req.body.email).password)) {//!getUserByPassword(req.body.password)
//     res.cookie('user_id', getUserByEmail(req.body.email).id);
//     res.redirect("/urls");
//   } else {
//     console.log("password didn't match")
//     res.sendStatus(403);
//   }
// });

app.post("/urls", (req, res) => {
  const short = generateRandomString();
  urlDatabase[short] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${short}`);
});



//add post function to handle users logging out
app.post("/logout", (req, res) => {
  //console.log(req.cookies)
  //console.log(req.cookies["user_id"]);
  //res.clearCookie('user_id', req.cookies["user_id"]);
  req.session = null;
  res.redirect("/urls");
});

//handles edit functions of URLs
app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.send("you can only modify or delete URLs you've created");
  }
});
  
//handles deletion of URLS
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.Status(404).send("you can only modify or delete URLs you've created");
  }
});
  
//---------------------------------------------------Get handlers---------------------------------------------------------------------------
  
  
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});
  
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.sendStatus(404);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});
  
//function for checking my objects are as they should be, this function should be commented out for publishing.
app.get("/urls.json", (req, res) => {
  //res.json(urlDatabase);
  res.json(users);
});
  
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
//---------------------------------------------------Page renderers---------------------------------------------------------------------------
  
//render login page when user attempts to login
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.session.user_id, urlDatabase), user: users[req.session.user_id] };// previous code that was here for reference username: req.cookies["username"]};
  res.render("urls_index", templateVars); //doubting users is correct, should be the object for the user...user_id: users[req.cookies["username"]]
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase, user: users[req.session.user_id]//user_id: users[req.cookies["user_id"]]
  };
  if (!users[req.session.user_id]) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//rendering registration page
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { urls: urlDatabase, user: users[req.session.user_id]};
  res.render("urls_register", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  if (!users[req.session.user_id]) {
    return res.sendStatus(404);
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.sendStatus(404);
  }
  if (users[req.session.user_id].id !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(403);
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id]};
  res.render("urls_show", templateVars);
});
//if a URL for the given ID does not exist:
//(Minor) returns HTML with a relevant error message
// if user is not logged in:
// returns HTML with a relevant error message
// if user is logged it but does not own the URL with the given ID:
// returns HTML with a relevant error message
