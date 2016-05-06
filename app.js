var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var db = require('./models/db');
var config = require('./config');
var jwt = require('jsonwebtoken');

var routes = require('./routes/index');
var stories = require('./routes/stories');
var authenticate = require('./routes/authenticate');
var register = require('./routes/register');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//routes don't need to be authenticated
app.use('/authenticate', authenticate);
app.use('/register', register);

//middleware for authentication
app.use(function (req, res, next) {

    //get token from body or header
    var token = req.headers['token'] || req.body.token;
    if (token) {


        //verifies secret and check exp
        jwt.verify(token, config.auth.SECRET, function (err, decoded) {
            if (err) {
                console.log(err);
                return res.status(401).send({
                    success: false,
                    message: err.message
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        })
    } else {

        //there is no token
        return res.status(401).send({
            success: false,
            message: "No token provided"
        })
    }
});

//routes need to be authenticated
app.use('/', routes);
app.use('/stories', stories);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
