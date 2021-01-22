//Helper to return a user object based on provided email
const getUserByEmail = function(email, database) {
  const bool = false;
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    } 
  }
  return bool;
};

//Helper to return all urls from the provided user's id
const urlsForUser = function(id, database) {
  let myURLS = {};
  for (const sLinks in database) {
    if (id === database[sLinks].userID) {
      myURLS[sLinks] = database[sLinks];
    }
  }
  return myURLS;
};

//helper to generate a random string of 6 characters
const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16);
};

module.exports = {
  getUserByEmail,
  urlsForUser,
  generateRandomString
};