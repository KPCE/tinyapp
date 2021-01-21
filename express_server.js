const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

//---------------------------------------------------Middleware---------------------------------------------------------------------------


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
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
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//---------------------------------------------------HELPER FUNCTIONS---------------------------------------------------------------------------

const getUserByEmail = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    } else {
      return false;
    }
  }
};

const getUserByPassword = function(password) {
  for (let user in users) {
    if (users[user].password === password) {
      return users[user];
    } else {
      return false;
    }
  }
};

const urlsForUser = function(id) {
  let myURLS = {};
  for (let sLinks in urlDatabase) {
    if (id === urlDatabase[sLinks].userID) {
      myURLS[sLinks] = urlDatabase[sLinks];
    }
  }
  return myURLS;
};


const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16);
};
//---------------------------------------------------Post Handlers ---------------------------------------------------------------------------

//handler for new users to register, adding to our users object
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    console.log(users);
    res.sendStatus(400);
    console.log(users);
  } else if (getUserByEmail(req.body.email)) {
    console.log(users);
    res.sendStatus(400);
    console.log(users);
  }
  const short = generateRandomString();
  users[short] = {
    id: short,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user_id', short);
  console.log(urlDatabase[short]);
  res.redirect("/urls");
});


app.post("/urls", (req, res) => {
  const short = generateRandomString();
  urlDatabase[short] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
  res.redirect(`/urls/${short}`);
});

//add post function to handle users logging in
app.post("/login", (req, res) => {
  if (!getUserByEmail(req.body.email)) {
    //console.log(users)
    res.sendStatus(403);
    //console.log(users)
  } else if (!getUserByPassword(req.body.password)) {
    //console.log(users)
    res.sendStatus(403);
    //console.log(users)
  } else {
    res.cookie('user_id', getUserByEmail(req.body.email).id);
    res.redirect("/urls");
  }
});


//add post function to handle users logging out
app.post("/logout", (req, res) => {
  //console.log(req.cookies)
  //console.log(req.cookies["user_id"]);
  res.clearCookie('user_id', req.cookies["user_id"]);
  res.redirect("/urls");
});

//handles edit functions of URLs
app.post("/urls/:shortURL", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.send("you can only modify or delete URLs you've created");
  }
});
  
//handles deletion of URLS
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.send("you can only modify or delete URLs you've created");
  }
});
  
//---------------------------------------------------Get handlers---------------------------------------------------------------------------
  
  
app.get("/", (req, res) => {
  res.send("Hello!");
});
  
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});
  
//why is this here? does it do anything? should probaby delete so people can't get my full database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
  
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
//---------------------------------------------------Page renderers---------------------------------------------------------------------------
  
//render login page when user attempts to login
app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.cookies["user_id"]), user: users[req.cookies["user_id"]] };// previous code that was here for reference username: req.cookies["username"]};
  res.render("urls_index", templateVars); //doubting users is correct, should be the object for the user...user_id: users[req.cookies["username"]]
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase, user: users[req.cookies["user_id"]]//user_id: users[req.cookies["user_id"]]
  };
  if (!users[req.cookies["user_id"]]) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//rendering registration page
app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_register", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
});


