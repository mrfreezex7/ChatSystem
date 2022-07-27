const express = require('express');

const router = express.Router();

const PageController = require('../controllers/page');
const isAuth = require('../middleware/is-auth');

router.get('/', isAuth.isAuthRedirect, PageController.getLoginPage);

router.get('/signupPage', isAuth.isAuthRedirect, PageController.getSignUpPage);

router.post('/logIn', PageController.postLogIn);

router.post('/signupUser', PageController.postSignup);

router.get('/chatPage', isAuth.isAuth, PageController.getChatPage);

router.post('/logout', PageController.postLogout);

module.exports = router;