exports.isAuth = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/');
    }
    next();
}

exports.isAuthRedirect = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        next();
    } else {
        return res.redirect('/chatPage');
    }
}


