/*jslint node: true */
"use strict";

var mysql = require('mysql'),
    async = require('async'),
    program = require('commander'),
    prompt = require('prompt'),
    prepareDB = require("./prepare_db_lib.js");

var self = {};
var db;

let options = {
    exclude_all: [],
    exclude_insert: [],
    exclude_update: [],
    exclude_delete: []
};

async.series([function (cb) {
    program
        .version('0.1.56')
        .option('-d, --db [db]', "Database to prepare (user@hostname/schema)")
        .option('-e, --exclude_all [tables]', "Excluded all tables (separated by commas)")
        .option('-i, --exclude_insert [tables]', "Excluded insert triggers on tables (separated by commas)")
        .option('-u, --exclude_update [tables]', "Excluded update triggers on tables (separated by commas)")
        .option('-r, --exclude_delete [tables]', "Excluded delete triggers on tables (separated by commas)")
        .parse(process.argv);

    if (!program.db) {
        return cb(new Error("From Parameter not found"));
    }

    var arr;
    arr = /([^:@]*)(:([^@]+))?@([^:\/]*)(:(.*))?\/(.*)/.exec(program.db);

    if (!arr) {
        return cb(new Error("Error parsing Database"));
    }

    if (program.exclude_all !== null && program.exclude_all !== undefined) {
        if (typeof (program.exclude_all) !== "string") {
            return cb(new Error("Parameter of exclude_all tables needs them separated by commas."));
        }
        options.exclude_all = program.exclude_all.split(',');
    }

    if (program.exclude_insert !== null && program.exclude_insert !== undefined) {
        if (typeof (program.exclude_insert) !== "string") {
            return cb(new Error("Parameter of exclude_insert tables needs them separated by commas."));
        }
        options.exclude_insert = program.exclude_insert.split(',');
    }

    if (program.exclude_update !== null && program.exclude_update !== undefined) {
        if (typeof (program.exclude_update) !== "string") {
            return cb(new Error("Parameter of exclude_update tables needs them separated by commas."));
        }
        options.exclude_update = program.exclude_update.split(',');
    }

    if (program.exclude_delete !== null && program.exclude_delete !== undefined) {
        if (typeof (program.exclude_delete) !== "string") {
            return cb(new Error("Parameter of exclude_delete tables needs them separated by commas."));
        }
        options.exclude_delete = program.exclude_delete.split(',');
    }


    self.db = {
        host: arr[4],
        port: arr[6] ? arr[6] : 3306,
        user: arr[1],
        database: arr[7],
        password: arr[2] ? arr[3] : null
    };

    if (self.db.password !== null) {
        return cb();
    }

    prompt.message = "";
    prompt.delimiter = "";

    prompt.start();
    prompt.get({
        properties: {
            pwddb: {
                hidden: true,
                description: arr[5] + " password: "
            }

        }
    }, function (err, result) {
        if (err) {
            return cb(err);
        }
        self.db.password = result.pwddb;
        cb();
    });
}, function (cb) {
    db = mysql.createConnection(self.db);
    db.connect(cb);
}, function (cb) {
    prepareDB(db, cb, options);
}], function (err) {
    if (err) {
        console.log("Error: " + err);
        console.log(err.stack);
        program.outputHelp();
        process.exit(-1);

    } else {
        process.exit(0);
    }
});



