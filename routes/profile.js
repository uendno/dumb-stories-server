
var express = require("express");
var multer = require("multer");
var mongoose = require("mongoose");
var Grid = require("gridfs-stream");
var fs = require("fs");
var config = require("../config");

var User = require("../models/User");
var Story = require("../models/Story");

var router = express.Router();
var upload = multer({ dest: 'temp/' });
var ObjectId = mongoose.Types.ObjectId;
var conn = mongoose.connection;
Grid.mongo = mongoose.mongo;

//route for getting a profile
router.get('/:id', function (req, res) {
    //check id format
    if (!ObjectId.isValid(req.params.id)) {
        console.log("Invalid id");
        return res.send({
            success: false,
            message: "Wrong id format"
        });
    }


    User.findById(new ObjectId(req.params.id)).populate({ path: 'stories', options: { sort: { 'created_at': -1 } } })
        .exec(function (err, user) {
            if (err) {
                console.log(err);
                return res.send({
                    success: false,
                    message: err.message
                });
            } else {
                if (user == null) {
                    console.log("null user");
                    return res.send({
                        success: false,
                        message: "User not found"
                    })
                } else {

                    var resultStories = [];
                    for (var position = 0; position < user.stories.length; position++) {

                        var story = user.stories[position];

                        //get a review for this story
                        var preview = story.pieces[0].content;
                        var reviewLength = config.text.REVIEW_LENGTH;
                        if (reviewLength < preview.length) {
                            while (reviewLength >= 0 && preview.charAt(reviewLength) != ' ') {
                                reviewLength--;
                            }

                            preview = preview.substr(0, reviewLength) + "..."

                        }

                        var imageLink = "";
                        if (story.image != null) {
                            imageLink = "http://" + config.server.IP_ADDRESS + ":" + config.server.PORT + "/image/" + story.image
                        }

                        //story for adding to the response resultStories[]
                        var resStory = {
                            _id: story._id,
                            title: story.title,
                            image: imageLink,
                            creator: {
                                _id: user._id,
                                name: user.user_name
                            },
                            preview: preview,
                            created_at: story.created_at,
                            updated_at: story.updated_at
                        };

                        //push to resultStories[]
                        resultStories.push(resStory);
                    }


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
                            stories: resultStories,
                            created_at: user.created_at,
                            updated_at: user.updated_at
                        }
                    })
                }
            }
        });
});

//route for getting all pieces wirten by user
router.get("/:id/allpieces", function (req, res) {
    //check id format
    if (!ObjectId.isValid(req.params.id)) {
        console.log("Invalid id");
        return res.send({
            success: false,
            message: "Wrong id format"
        });
    }

    Story.find({ 'pieces.creator_id': req.params.id }, null, { sort: { 'created_at': -1 } }, function (err, pieces) {
        if (err) {
            console.log(err);
            return res.send({
                success: false,
                pieces: errr.message
            })
        } else {
            return res.send({
                success: true,
                pieces: pieces
            })
        }
    })
})

//route for upload avatar
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