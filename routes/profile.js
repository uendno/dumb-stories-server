
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
            var iamgeLink = "";
            if (user.avatar != null) {
                imageLink = "http://" + config.server.IP_ADDRESS + ":" + config.server.PORT + "/image/" + user.avatar
            }

            return res.send({
                success: true,
                data: {
                    _id: user._id,
                    user_name: user.user_name,
                    avatar: imageLink,
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
                function (err) {
                    if (err) {

                        //delete file
                        deleteTemp(req.file.path);
                        
                        console.log(err);
                        return res.send({
                            success: false,
                            message: err.message
                        });
                        
                    } else {
                        //delete file
                        deleteTemp(req.file.path);

                        return res.send({
                            success: true,
                            message: "Upload avatar successfully"
                        })
                    }
                }
            )
        })
    })

});

var deleteTemp = function (path) {
    //delete temp file
    fs.unlink(path, function (err) {
        if (err) {
            console.log(err);
        }
    })
}

module.exports = router;