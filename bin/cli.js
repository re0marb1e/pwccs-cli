"use strict"

const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const { spawn, spawnSync } = require('child_process');

const program = require('commander');
const chalk = require('chalk');
const _ = require('lodash');
const validateProjectName = require('validate-npm-package-name');

const curPackageJson = require('../package.json');
const huskyConf = require('../config/husky.config');
const standardVersionConf = require('../config/standard-version.config');

program.version('0.1.0', '-v, --version');

program.command('init <projectDir>')
    .action((projectDir, cmd) => {
        createProject(projectDir);
    });

program.parse(process.argv);

function createProject(projectDir){
    const root = path.resolve(projectDir);
    const projectName = path.basename(root);

    checkProjectName(projectName);

    console.log(`Creating a project with conventional commits specification in ${chalk.green(root)}.`);
    console.log();

    fs.mkdirSync(projectDir);

    let packageJson = {
        name: projectName,
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
    const dependencies = ['@commitlint/config-conventional@^7.1.2', '@commitlint/cli@^7.2.1', 'husky@^1.1.2', 'standard-version@^4.4.0'];
    const args = [
      'install',
      '--save-dev',
    ].concat(dependencies);
    spawnSync(command, args, { stdio: 'inherit' });

    // git commit
    gitFirstCommitSync();
}

function checkProjectName(projectName){
    const validationResult = validateProjectName(projectName);
    if (!validationResult.validForNewPackages) {
        console.error(
            `Could not create a project called ${chalk.red(`"${projectName}"`)} because of npm naming restrictions:`
            );
        printValidationResults(validationResult.errors);
        printValidationResults(validationResult.warnings);
        process.exit(1);
    }
  
    const dependencies = ['@commitlint/config-conventional', '@commitlint/cli', 'husky', 'standard-version'].sort();
    if (dependencies.indexOf(projectName) >= 0) {
        console.error(
            chalk.red(
                `We cannot create a project called ${chalk.green(
                    projectName
                )} because a dependency with the same name exists.\n` +
                `Due to the way npm works, the following names are not allowed:\n\n`
            ) +
            chalk.cyan(dependencies.map(depName => `  ${depName}`).join('\n')) +
            chalk.red('\n\nPlease choose a different project name.')
        );
        process.exit(1);
    }
}

function printValidationResults(results) {
    if (typeof results !== 'undefined') {
        results.forEach(error => {
            console.error(chalk.red(`  *  ${error}`));
        });
    }
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
    spawnSync("git", ["commit", "-m", `build: initial commit from pwcss-cli@${curPackageJson.version}`], { stdio: 'inherit' });
}

// TODO: remove dependency on commitizen
function commitizenInitSync(){
    const command = "commitizen";
    const args = ["init", "cz-conventional-changelog" , "--save"];
    spawnSync(command, args);
}