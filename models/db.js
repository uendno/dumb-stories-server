/**
 * Created by uendn on 5/1/2016.
 */

// bring mongoose into the app
var mongoose = require('mongoose');
var config = require('../config.js');

// build the connection string
var dbURI = config.db.URI;
console.log(dbURI);

// Create the database connection
mongoose.connect(dbURI);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function() {
    console.log("DB connected");
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
    console.log('DB connection has an error: '+err);
});

// If the connection is disconnected
mongoose.connection.on('disconnected', function () {
    console.log('DB disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
    mongoose.connection.close(function(){
        console.log('Mongoose disconnected through the app termination');
        process.exit(0);
    })
});

