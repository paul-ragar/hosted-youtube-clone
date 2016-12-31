const app = require('./../server');
const db = app.get('db');

const bcrypt = require('bcryptjs');

const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
};


module.exports = {
  registerUser: (req, res) => {
    const user = req.body;
    user.password = hashPassword(user.password);

    db.user_create([ user.email, user.password], (err, user) => {
      if (err) return res.status(500).send(err);
      user = user[0]
      delete user.password;
      res.status(200).send(user);

    });
  },
  me: (req, res) => {
    if (!req.user) return res.status(401).send('current user not defined');
    // console.log('req.user: ', req.user);
    //remove password for security, do not send it back
    // delete user.password;
    // console.log(user);

    //return user object without passwordreturn
    return res.status(200).json(req.user);

  }




//END OF EXPORT
}
