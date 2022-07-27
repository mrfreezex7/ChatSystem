exports.get404Page = (req, res, next) => {
    res.render('pages/404', { pageTitle: "404 Error" });
}