const bcrypt = require("bcryptjs");

const User = require("../models/user");
const Friend = require("../models/friend");

exports.getLoginPage = (req, res, next) => {
  res.render("pages/loginPage", { pageTitle: "Login Page" });
};

exports.postLogIn = (req, res, next) => {
  const username = req.body.username.trim().toLowerCase();
  const password = req.body.password.trim().toLowerCase();

  User.findById(username)
    .then((user) => {
      if (user != null) {
        bcrypt
          .compare(password, user.password)
          .then((result) => {
            if (result) {
              req.session.isLoggedIn = true;
              req.session.user = user;
              return req.session.save((err) => {
                console.log(err);

                res.redirect("/chatPage");
              });
            } else {
              return res.redirect("/");
            }
          })
          .catch((err) => {
            console.log(err);
            res.redirect("/");
          });
      } else {
        res.redirect("/");
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getSignUpPage = (req, res, next) => {
  res.render("pages/signupPage", { pageTitle: "Sign Up Page" });
};

exports.postSignup = (req, res, next) => {
  const username = req.body.username.trim().toLowerCase();
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password.trim().toLowerCase();

  User.findById(username)
    .then((user) => {
      if (user) {
        console.log("User Already Exists");
        return res.redirect("/signupPage");
      } else {
        return bcrypt
          .hash(password, 12)
          .then((hashedPassword) => {
            const image = req.file;
            console.log(image);
            const user = new User(username, email, image.path, hashedPassword);
            user
              .save()
              .then((result) => {
                console.log(username + " Added to The Users DB");

                const friend = new Friend(username);
                friend
                  .save()
                  .then((result) => {
                    console.log(username + " Added to the Friends DB");
                    res.redirect("/");
                  })
                  .catch((err) => {
                    console.log(err);
                    res.redirect("/signupPage");
                  });
              })
              .catch((err) => {
                console.log(err);
                res.redirect("/signupPage");
              });
          })
          .catch((err) => {
            console.log(err);
            res.redirect("/signupPage");
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getChatPage = (req, res, next) => {
  res.render("pages/chatPage", {
    pageTitle: "Chat Page",
    user: req.session.user,
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};
