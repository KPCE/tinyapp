
const getUserByEmail = function(email, database) {
  let bool = false;
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    } 
  }
  return bool;
};

const urlsForUser = function(id, database) {
  let myURLS = {};
  for (let sLinks in database) {
    if (id === database[sLinks].userID) {
      myURLS[sLinks] = database[sLinks];
    }
  }
  return myURLS;
};


const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16);
};

module.exports = {
  getUserByEmail,
  urlsForUser,
  generateRandomString
};