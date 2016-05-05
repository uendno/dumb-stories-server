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
        return res.status(400).send({
            success: false,
            message: "Null user_name or password"
        });
    }
    
    var userName = req.body.user_name;
    var password = req.body.password;
    
    User.findOne({
        user_name: userName
    }, function (err, user) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                success: false,
                message: err
            });

        } else {
            if (user) {
                console.log("user_name exits");
                return res.status(409).send({
                    success: false,
                    message: "User name exits"
                });
            } else {
                var newUser = User({
                    user_name: userName,
                    password: password
                });

                newUser.save(function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send({
                            success: false,
                            message: err
                        });
                    } else {
                        console.log("created user successfully");

                        var result = User.findOne({
                            user_name: userName
                        }, function (err, user) {
                            if (err) {
                                console.log(err);
                                return res.status(500).send({
                                    success: false,
                                    message: err
                                });
                            } else {
                                if (!user) {
                                    console.log("Error while getting back saved user");
                                    return res.status(500).send({
                                        success: false,
                                        message: "Error while getting back saved user."
                                    });
                                } else {
                                    // create a token
                                    var token = jwt.sign(newUser, config.auth.SECRET, {
                                        expiresIn: config.auth.EXP_TIME
                                    });

                                    return res.status(200).send({
                                        success: true,
                                        message: "Create user successfully",
                                        token: token,
                                        user: user
                                    })
                                }
                            }
                        });


                    }
                })

            }
        }
    })
});

module.exports = router;