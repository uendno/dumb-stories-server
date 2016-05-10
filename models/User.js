/**
 * Created by uendn on 5/1/2016.
 */

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;

var userSchema = new Schema({
    user_name: {type: String, index: true},
    password: String,
    avatar: ObjectIdSchema,
    stories:  [{ type: Schema.Types.ObjectId, ref: 'Story' }],
    created_at: Date,
    updated_at: Date
});

userSchema.pre('save', function (next) {
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

var User = mongoose.model('User', userSchema);

module.exports = User;
