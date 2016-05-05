/**
 * Created by uendn on 5/1/2016.
 */

var mongoose = require('mongoose');
var User = require('./User.js');

var Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;


//create a schema

var pieceSchema = new Schema({
    _id: ObjectIdSchema,
    creator_id: ObjectIdSchema,
    content: String,
    next_start: String,
    created_at: Date,
    updated_at: Date
});

var storySchema = new Schema({
    title: String,
    creator_id: ObjectIdSchema,
    pieces: [pieceSchema],
    created_at: Date,
    updated_at: Date
});

storySchema.pre('save', function (next) {
    //get current date
    var currentDate = new Date;

    //change the updated_at filed to current date
    this.updated_at = currentDate;

    //if created_at does not exit, add to that field
    if (!this.created_at) {
        this.created_at = currentDate;
    }
    next();
});



var Story = mongoose.model('Story', storySchema);

module.exports = Story;