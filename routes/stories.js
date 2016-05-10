/**
 * Created by uendn on 5/1/2016.
 */

var express = require('express');
var Story = require('../models/Story');
var User = require('../models/User');
var config = require('../config');
var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
var multer = require("multer");
var fs = require("fs");

var router = express.Router();
var ObjectId = mongoose.Types.ObjectId;
var upload = multer({ dest: 'temp/' });
var conn = mongoose.connection;

Grid.mongo = mongoose.mongo;

//route for getting all the stories
router.get('/', function (req, res) {

    Story.find({}, null,
        {
            sort: {
                updated_at: -1
            }
        })
        .populate('creator_id')
        .exec(function (err, stories) {
            if (err) {
                console.log(err);
                return res.send({
                    success: false,
                    message: err.message
                });
            } else {

                //if result is null
                if (stories == null || stories.length == 0) {
                    console.log("null stories");

                    return res.send({
                        success: false,
                        message: "No stories"
                    });
                } else {
                    var data = [];
                    for (var position = 0; position < stories.length; position++) {

                        var story = stories[position];

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

                        //other writers
                        var otherIds = [];
                        for (var i = 0; i < story.pieces.length; i++) {
                            var currentPiece = story.pieces[i];
                            
                          
                            
                            var isContained = false;
                            if (currentPiece.creator_id.equals(story.creator_id._id)) {
                                isContained = true;
                            } else {
                                for (var j = 0; j < otherIds.length; j++) {
                                    if (otherIds[j] == currentPiece.creator_id) {
                                        isContained = true;
                                    }
                                }
                            }

                            if (!isContained) {
                                otherIds.push(currentPiece.creator_id);
                            }
                        }



                        User.find({ _id: { $in: otherIds } }, '_id user_name', null, function (err, others) {
                            if (err) {
                                console.log(err);
                                return res.send({
                                    success: true,
                                    message: err.message
                                });
                            } else {
                                //story for adding to the response data[]
                                var resStory = {
                                    _id: story._id,
                                    title: story.title,
                                    image: imageLink,
                                    creator: {
                                        _id: story.creator_id._id,
                                        name: story.creator_id.user_name
                                    },
                                    others: others,
                                    preview: preview,
                                    created_at: story.created_at,
                                    updated_at: story.updated_at
                                };

                                //push to data[]
                                data.push(resStory);

                                //check if this is the final part of data[]
                                if (data.length == stories.length) {
                                    return res.send({
                                        success: true,
                                        data: data
                                    })
                                }
                            }
                        })



                    }
                }
            }
        })
});

//route for getting a particular stories by it's id
router.get('/:id', function (req, res) {

    //check id format
    if (!ObjectId.isValid(req.params.id)) {

        console.log("Invalid id");
        return res.send({
            success: false,
            message: "Wrong id format"
        });
    }

    Story.findById(new ObjectId(req.params.id))
        .populate('creator_id')
        .exec(function (err, story) {

            if (err) {
                console.log(err);
                return res.send({
                    success: false,
                    message: err.message
                });
            } else {
                //if result is null
                if (story == null) {
                    console.log("null result");

                    return res.send({
                        success: false,
                        message: "Can't find the story"
                    })
                } else {

                    //result pieces to be sent
                    var resultPieces = [];

                    for (var position = 0; position < story.pieces.length; position++) {

                        var piece = story.pieces[position];
                        var start = "";
                        if (position > 0) {
                            start = story.pieces[position - 1].next_start;
                        }

                        //Find the creator of the piece
                        //We prevent the story variable from the side effect of asynchronous loop
                        // by passing it in to this immediately invoked function expression
                        (function (piece, start) {

                            //find piece creator
                            User.findById(piece.creator_id, function (err, pieceCreator) {
                                if (err) {
                                    console.log(err);
                                    return res.send({
                                        success: false,
                                        message: erer.message
                                    });
                                } else {
                                    if (pieceCreator == null) {
                                        console.log("null piece creator");
                                        return res.send({
                                            success: false,
                                            message: "Can't find the creator of the piece"
                                        })
                                    } else {

                                        //data for adding to the resultPiece
                                        var content = piece.content;

                                        //check if it's a 1st piece or not, if not, it's send back the content containing the it's start defined by the previous piece
                                        var resultPiece = {
                                            _id: piece._id,
                                            creator: {
                                                _id: pieceCreator._id,
                                                name: pieceCreator.user_name
                                            },
                                            start: start,
                                            content: content,
                                            next_start: piece.next_start,
                                            created_at: piece.created_at,
                                            updated_at: piece.updated_at
                                        };

                                        resultPieces.push(resultPiece);
                                    }

                                    //if this is the last part of result pieces
                                    if (resultPieces.length == story.pieces.length) {

                                        var imageLink = "";
                                        if (story.image != null) {
                                            imageLink = "http://" + config.server.IP_ADDRESS + ":" + config.server.PORT + "/image/" + story.image
                                        }

                                        return res.send({
                                            success: true,
                                            data: {
                                                _id: story._id,
                                                title: story.title,
                                                image: imageLink,
                                                creator: {
                                                    _id: story.creator_id._id,
                                                    name: story.creator_id.user_name
                                                },
                                                pieces: resultPieces,
                                                created_at: story.created_at,
                                                updated_at: story.updated_at
                                            }
                                        })
                                    }
                                }
                            });
                        })(piece, start);
                    }
                }
            }
        })
});

//route for posting a story into data base
router.post('/newstory', function (req, res) {

    var creatorID = req.decoded._doc._id;
    var body = req.body;

    //Check null data
    if (body.title == null || body.content == null || body.next_start == null) {
        console.log("Null data");
        return res.send({
            success: false,
            message: "Null data"
        });
    }
    var story = Story({
        title: body.title,
        creator_id: creatorID,
        pieces: [
            {
                _id: new ObjectId,
                creator_id: creatorID,
                content: body.content,
                next_start: body.next_start,
                created_at: new Date,
                updated_at: new Date,
            }
        ]
    });



    story.save(function (err, story) {

        if (err) {
            console.log(err);
            return res.send({
                success: false,
                message: err.message
            });
        } else {

            User.findOneAndUpdate({ _id: story.creator_id }, {
                $push: {
                    stories: story.id
                }
            }, function (err) {
                if (err) {
                    console.log(err);
                    return res.send({
                        success: false,
                        message: err.message
                    });
                } else {
                    console.log("created story successfully");
                    return res.send({
                        success: true,
                        message: "Create story successfully",
                        story: story
                    });
                }
            })
        }
    })
});

//route for posting a piece into a particular story specified by it's id
router.post('/:id/newpiece', function (req, res) {

    //check id format
    if (!ObjectId.isValid(req.params.id)) {
        console.log("Invalid id");
        return res.send({
            success: false,
            message: "Wrong id format"
        });
    }

    //Check null data
    if (req.body.next_start == null || req.body.content == null) {
        console.log("Null data");
        return res.send({
            success: false,
            message: "Null data"
        });
    }
    Story.findOneAndUpdate(
        {
            _id: new ObjectId(req.params.id)
        },
        {
            $push: {
                "pieces": {
                    _id: new ObjectId,
                    creator_id: req.decoded._doc._id,
                    content: req.body.content,
                    next_start: req.body.next_start,
                    created_at: new Date,
                    updated_at: new Date
                }
            }
        },
        function (err) {
            if (err) {
                console.log(err);
                return res.send({
                    success: false,
                    message: err.message
                });
            } else {
                return res.send({
                    success: true,
                    message: "Add piece successfully"
                })
            }
        })
});

//route for upload image to a story
router.put('/:id/uploadimage', upload.single('image'), function (req, res) {
    var gfs = Grid(conn.db);
    //check id format
    if (!ObjectId.isValid(req.params.id)) {

        //delete file
        deleteTemp(req.file.path);

        console.log("Invalid id");
        return res.send({
            success: false,
            message: "Wrong id format"
        });
    }

    //if there is no file on req
    if (req.file == null) {
        console.log("null file");
        res.send({
            success: false,
            message: "No file!"
        })
    }
    var originalname = req.file.originalname;
    var extension = originalname.substring(originalname.lastIndexOf('.'));
    //remove file if it exits
    gfs.remove({
        filename: "image-" + req.params.id + extension
    }, function (err) {

        var writestream = gfs.createWriteStream({
            filename: "image-" + req.params.id + extension
        });
        fs.createReadStream(req.file.path).pipe(writestream);

        writestream.on('close', function (file) {
            Story.findById(new ObjectId(req.params.id), function (err, story) {
                if (err) {
                    console.log(err);
                    return res.send({
                        success: false,
                        message: err.message
                    });
                } else {

                    if (story == null) {

                        console.log("Null story");
                        //delete file
                        deleteTemp(req.file.path);

                        return res.send({
                            success: false,
                            message: "Story not found"
                        })
                    } else {

                        //check if user created this story or not
                        if (story.creator_id != req.decoded._doc._id) {
                            //delete file
                            deleteTemp(req.file.path);

                            return res.send({
                                success: false,
                                message: "You don't have permission to do this!"
                            })
                        } else {
                            story.image = file._id;
                            story.save(function (err) {
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
                                        message: "Upload image successfully"
                                    })
                                }
                            })
                        }
                    }
                }
            })
        })
    })
})

//route for update story information
router.put('/:id', function (req, res) {
    //check id format
    if (!ObjectId.isValid(req.params.id)) {
        console.log("Invalid id");
        return res.send({
            success: false,
            message: "Wrong id format"
        });
    }

    //Check null data
    if (req.body.story == null) {
        console.log("Null data");
        return res.send({
            success: false,
            message: "Null data"
        });
    }

    console.log(req.body.story);

    Story.findOneAndUpdate(
        {
            _id: req.params.id
        },
        req.body.story,
        function (err) {
            if (err) {
                console.log(err);
                return res.send({
                    success: false,
                    message: err.message
                });
            } else {
                return res.send({
                    success: true,
                    message: "Update successfully"
                })
            }
        })
})

//route for delete a story
router.delete("/:id", function (req, res) {
    //check id format
    if (!ObjectId.isValid(req.params.id)) {
        console.log("Invalid id");
        return res.send({
            success: false,
            message: "Wrong id format"
        });
    }

    Story.findById(new ObjectId(req.params.id), function (err, story) {
        if (err) {
            console.log(err);
            return res.send({
                success: false,
                message: err.message
            });
        } else {
            if (req.decoded._doc._id != story.creator_id) {
                return res.send({
                    success: false,
                    message: "You don't have permission to do this!"
                })
            } else {
                Story.remove({ _id: req.params.id }, function (err) {
                    if (err) {
                        console.log(err);
                        return res.send({
                            success: false,
                            message: err.message
                        });
                    } else {
                        return res.send({
                            success: true,
                            message: "Delete story successfully"
                        })
                    }
                })
            }
        }
    })
})

var deleteTemp = function (path) {
    //delete temp file
    fs.unlink(path, function (err) {
        if (err) {
            console.log(err);
        }
    })
}

module.exports = router;