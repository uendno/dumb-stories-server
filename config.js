var config = {};

config.db = {URI: 'mongodb://localhost:27017/dummy_stories'};

config.text = {
    REVIEW_LENGTH: 300
}

config.auth = {
    SECRET: "thangdeptrai",
    EXP_TIME: 86400
}

module.exports = config;
