
var express = require("express");
var mongoose = require("mongoose");
var Grid = require("gridfs-stream");
var fs = require("fs");
var path = require('path');

var router = express.Router();
var conn = mongoose.connection;
var ObjectId = mongoose.Types.ObjectId;

Grid.mongo = mongoose.mongo;

router.get("/:id", function (req, res) {

    //check id format
    if (!ObjectId.isValid(req.params.id)) {
        console.log("Invalid id");
        return res.send({
            success: false,
            message: "Wrong id format"
        });
    }

    var gfs = Grid(conn.db);
    gfs.findOne({ _id: req.params.id }, function (err, file) {
        if (err) {
            console.log(err.message);
            return res.send({
                success: false,
                message: err.message
            })
        } else {
            if (file == null) {
                console.log("File not found.");
                return res.send({
                    success: false,
                    message: "File not found."
                })
            } else {
                console.log(file);
                var writestream = fs.createWriteStream('./temp/' + file.filename);
                var readstream = gfs.createReadStream({
                    _id: new ObjectId(req.params.id)
                });
                readstream.pipe(writestream);
                writestream.on('close', function (err) {
                    if (err) {
                        console.log(err.message);
                        return res.send({
                            success: false,
                            message: err.message
                        })
                    } else {
                        res.sendFile(path.dirname(module.parent.filename) + '/bin/temp/' + file.filename, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                fs.unlinkSync(path.dirname(module.parent.filename) + '/bin/temp/' + file.filename);
                            }
                        });

                    }
                })
            }

        }
    })



})

module.exports = router;