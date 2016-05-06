/**
 * Created by uendn on 5/3/2016.
 */

var express = require('express');
var jwt = require('jsonwebtoken');
var config = require('../config');
var User = require('../models/User');

var router = express.Router();

router.post('/', function (req, res) {

    //check null user_name or password
    if (req.body.user_name == null || req.body.password == null) {
        console.log("Null user_name or password");
        return res.send({
            success: false,
            message: "Null username or password"
        });
    }
    
    User.findOne({
        user_name: req.body.user_name
    }, function (err, user) {

        if (err) {
            console.log(err);
            res.send({
                success: false,
                message: err.message
            });
        } else {
            if (!user) {
                console.log("null user");
                res.send({
                    success: false,
                    message: "Authentication failed. User not found."
                });
            } else {

                //check if password matches
                if (user.password != req.body.password) {
                    console.log("wrong password");
                    res.send({
                        success: false,
                        message: "Authentication failed. Wrong password."
                    });
                } else {
                    // if user is found and password is right
                    // create a token
                    var token = jwt.sign(user, config.auth.SECRET, {
                        expiresIn: config.auth.EXP_TIME
                    });

                    // return the information including token as JSON
                    res.send({
                        success: true,
                        message: "Enjoy your token!",
                        token: token,
                        user: user
                    });
                }
            }
        }
    });
});

module.exports = router;