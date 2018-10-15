"use strict"

function config(){
    return {
        "husky": {
            "hooks": {
                "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
            }
        }
    }
}

module.exports = config;