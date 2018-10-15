"use strict"

const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const { spawn, spawnSync} = require('child_process');

const program = require('commander');
const chalk = require('chalk');
const _ = require('lodash');

const huskyConf = require('../config/husky.config');
const standardVersionConf = require('../config/standard-version.config');

program.version('0.1.0', '-v, --version');

program.command('init <projectName>')
    .action((projectName, cmd) => {
        createProject(projectName);
    });

program.parse(process.argv);

function createProject(projectName){
    const root = path.resolve(projectName);
    const appName = path.basename(root);

    console.log(`Creating a project in ${chalk.green(root)}.`);
    console.log();

    fs.mkdirSync(projectName);

    let packageJson = {
        name: appName,
        version: '0.1.0'
    };
    packageJson = appendHuskyConfig(packageJson);
    packageJson = appendStandardVersionConfig(packageJson);
    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(packageJson, null, 2) + os.EOL
    );

    process.chdir(root);

    // git init
    gitInitSync();

    // commitizen init
    commitizenInitSync();

    configCommitlintSync();

    // npm install
    const command = 'npm';
    const dependencies = ['@commitlint/config-conventional', '@commitlint/cli', 'husky', 'standard-version'];
    const args = [
      'install',
      '--save-dev',
    ].concat(dependencies);
    spawnSync(command, args, { stdio: 'inherit' });

    gitFirstCommitSync();
}

function appendHuskyConfig(packageJson){
    return _.merge(packageJson, huskyConf());
}

function appendStandardVersionConfig(packageJson){
    return _.merge(packageJson, standardVersionConf.config(),standardVersionConf.scripts());
}

function configCommitlintSync(){
    const commitlintConf = "module.exports = {extends: ['@commitlint/config-conventional']}";
    fs.writeFileSync(
        path.join('./', 'commitlint.config.js'),
        commitlintConf + os.EOL
    );
}

function gitInitSync(){
    // git init
    const command = "git";
    const args = ["init"];
    spawnSync(command, args);
    // add .gitignore
    const _gitignore = "node_modules/\ntest/" + os.EOL;
    fs.writeFileSync(
        path.join('./', '.gitignore'),
        _gitignore
    );
}

function gitFirstCommitSync() {
    spawnSync("git", ["add", "."], { stdio: 'inherit' });
    spawnSync("git", ["commit", "-m", "build: initial commit from pwcss-cli"], { stdio: 'inherit' });
}

function commitizenInitSync(){
    const command = "commitizen";
    const args = ["init", "cz-conventional-changelog" , "--save"];
    spawnSync(command, args);
}