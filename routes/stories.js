/**
 * Created by uendn on 5/1/2016.
 */

var express = require('express');
var Story = require('../models/Story');
var User = require('../models/User');
var config = require('../config');
var ObjectId = require('mongoose').Types.ObjectId;

var router = express.Router();

//route for getting all the stories
router.get('/', function (req, res) {

    Story.find({}, function (err, stories) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                success: false,
                message: err
            });
        } else {

            //if result is null
            if (stories == null || stories.length == 0) {
                console.log("null stories");

                return res.status(404).send({
                    success: false,
                    message: "no stories"
                });
            } else {
                var data = [];
                for (var position = 0; position < stories.length; position++) {

                    var story = stories[position];

                    //find the creator
                    //We prevent the story variable from the side effect of asynchronous loop
                    // by passing it in to this immediately invoked function expression
                    (function (story) {
                        User.findById(stories[position].creator_id, function (err, creator) {

                            if (err) {
                                console.log(err);
                                return res.status(500).send({
                                    success: false,
                                    message: "Process can't be done because of an error while finding the creator"
                                });
                            } else {
                                if (creator == null) {
                                    console.log("null story creator");

                                    return res.status(500).send({
                                        success: false,
                                        message: "Can't find the creator of the story"
                                    })
                                } else {

                                    //get a review for this story
                                    var review = story.pieces[0].content;
                                    var reviewLength = config.text.REVIEW_LENGTH;
                                    if (reviewLength < review.length) {
                                        while (reviewLength >= 0 && review.charAt(reviewLength) != ' ') {
                                            reviewLength--;
                                        }

                                        review = review.substr(0, reviewLength) + "..."

                                    }

                                    //story for adding to the response data[]
                                    var resStory = {
                                        _id: story._id,
                                        title: story.title,
                                        creator: {
                                            _id: creator._id,
                                            name: creator.user_name
                                        },
                                        review: review,
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
                            }
                        });
                    })(story);
                }
            }
        }
    })
});

//route for getting a particular stories by it's id
router.get('/:id', function (req, res) {
    Story.findById(new ObjectId(req.params.id), function (err, story) {
        console.log(new ObjectId(req.params.id));
        if (err) {
            console.log(err);
            return res.status(500).send({
                success: false,
                message: err
            });
        } else {
            //if result is null
            if (story == null) {
                console.log("null result");

                return res.status(404).send({
                    success: false,
                    message: "Can't find the story"
                })
            } else {
                //find creator of the story
                User.findById(story.creator_id, function (err, storyCreator) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send({
                            success: false,
                            message: "Process can't be done because of an error while finding the creator of story"
                        });
                    } else {
                        if (storyCreator == null) {
                            console.log("null story creator");

                            return res.status(500).send({
                                success: false,
                                message: "Can't find the creator of the story"
                            })
                        } else {
                            //result pieces to be sent
                            var resultPieces = [];

                            for (var position = 0; position < story.pieces.length; position++) {

                                var piece = story.pieces[position];

                                //Find the creator of the piece
                                //We prevent the story variable from the side effect of asynchronous loop
                                // by passing it in to this immediately invoked function expression
                                (function (piece) {
                                    User.findById(piece.creator_id, function (err, pieceCreator) {
                                        if (err) {
                                            console.log(err);
                                            return res.status(500).send({
                                                success: false,
                                                message: "Process can't be done because of an error while finding the creator of a piece"
                                            });
                                        } else {
                                            if (pieceCreator == null) {
                                                console.log("null piece creator");
                                                return res.status(500).send({
                                                    success: false,
                                                    message: "Can't find the creator of the piece"
                                                })
                                            } else {
                                                //data for adding to the resultPiece
                                                var resultPiece = {
                                                    _id: piece._id,
                                                    creator: {
                                                        _id: pieceCreator._id,
                                                        name: pieceCreator.user_name
                                                    },
                                                    content: piece.content,
                                                    created_at: piece.created_at,
                                                    updated_at: piece.updated_at
                                                };

                                                resultPieces.push(resultPiece);
                                            }

                                            //if this is the last part of result pieces
                                            if (resultPieces.length == story.pieces.length) {

                                                return res.send({
                                                    success: true,
                                                    data: {
                                                        _id: story._id,
                                                        title: story.title,
                                                        creator: {
                                                            _id: storyCreator._id,
                                                            name: storyCreator.user_name
                                                        },
                                                        pieces: resultPieces,
                                                        created_at: story.created_at,
                                                        updated_at: story.updated_at
                                                    }
                                                })
                                            }
                                        }
                                    });
                                })(piece);
                            }
                        }
                    }
                });
            }
        }
    })
});

//route for posting a story into data base
router.post('/', function (req, res) {

    var creatorID = req.decoded._doc._id;
    var body = req.body;

    //Check null data
    if(body.title == null || body.content == null){
        console.log("Null data");
        return res.status(400).send({
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
            }
        ]
    });

    story.save(function (err) {

        if (err) {
            console.log(err);
            return res.status(500).send({
                success: false,
                message: err
            });
        } else {
            console.log("created story successfully");
            return res.status(200).send({
                success: true,
                message: "Create story successfully"
            });

        }
    })
});

//route for posting a piece into a particular story specified by it's id
router.post('/:id', function (req, res) {

    //Check null data
    if(req.body.content == null){
        console.log("Null data");
        return res.status(400).send({
            success: false,
            message: "Null data"
        });
    }
    Story.findOneAndUpdate({_id: new ObjectId(req.params.id)},
        {
            $push: {
                "pieces": {
                    _id : new ObjectId,
                    creator_id: req.decoded._doc._id,
                    content: req.body.content,
                    created_at: new Date,
                    updated_at: new Date
                }
            }
        }, function (err) {
            console.log(new ObjectId(req.params.id));
            if (err) {
                console.log(err);
                return res.status(500).send({
                    success: false,
                    message: err
                });
            } else {
                return res.send({
                    success: true,
                    message: "Add piece successfully"
                })
            }

        })
});

module.exports = router;