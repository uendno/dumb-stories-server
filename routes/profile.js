
var express = require("express");
var multer = require("multer");
var mongoose = require("mongoose");
var Grid = require("gridfs-stream");
var fs = require("fs");
var config = require("../config");

var User = require("../models/User");

var router = express.Router();
var upload = multer({ dest: 'temp/' });
var ObjectId = mongoose.Types.ObjectId;
var conn = mongoose.connection;
Grid.mongo = mongoose.mongo;

router.get('/:id', function (req, res) {
    //check id format
    if (!ObjectId.isValid(req.params.id)) {
        console.log("Invalid id");
        return res.send({
            success: false,
            message: "Wrong id format"
        });
    }


    User.findById(new ObjectId(req.params.id), function (err, user) {
        if (err) {
            console.log(err);
            return res.send({
                success: false,
                message: err.message
            });
        } else {
            return res.send({
                success: true,
                data: {
                    _id: user._id,
                    user_name: user.user_name,
                    avatar: config.server.IP_ADDRESS + ":" + config.server.PORT + "/image/" + user.avatar,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                }
            })
        }
    }
    )


});

router.post('/uploadavatar', upload.single('avatar'), function (req, res) {
    var gfs = Grid(conn.db);

    //if there is no file on req
    if (req.file == null) {
        console.log("null file");
        return res.send({
            success: false,
            message: "No file!"
        })
    }
    var originalname = req.file.originalname;
    var extension = originalname.substring(originalname.lastIndexOf('.'));
    //remove file if it exits
    gfs.remove({
        filename: "avatar-" + req.decoded._doc._id + extension
    }, function (err) {

        var writestream = gfs.createWriteStream({
            filename: "avatar-" + req.decoded._doc._id + extension
        });
        fs.createReadStream(req.file.path).pipe(writestream);

        writestream.on('close', function (file) {
            User.findOneAndUpdate(
                {
                    _id: req.decoded._doc._id
                },
                {
                    $set: {
                        avatar: file._id
                    }
                },
                function (err1) {
                    if (err1) {
                       
                        //delete temp file
                        fs.unlink(req.file.path, function (err2) {
                            if (err2) {
                                console.log(err2);
                                return res.send({
                                    success: false,
                                    message: err2.message
                                });
                            } else {
                                console.log(err1);
                                return res.send({
                                    success: false,
                                    message: err1.message
                                });
                            }
                        })
                    } else {
                        //delete temp file
                        fs.unlink(req.file.path, function (err) {
                            if (err) {
                                console.log(err);
                                return res.send({
                                    success: false,
                                    message: err.message
                                });
                            } else {
                                return res.send({
                                    success: true,
                                    message: "Upload avatar successfully"
                                })
                            }
                        })
                    }
                }
            )
        })
    })

});

module.exports = router;