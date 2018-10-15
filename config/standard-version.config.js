"use strict"

function config(){
    return {
        "standard-version": {
            "skip": {
                "commit": true,
                "tag": true
            }
        }
    }
}

function scripts(){
    return {
        "scripts": {
            "release": "standard-version"
        }
    }
}

module.exports = {
    config, scripts
}