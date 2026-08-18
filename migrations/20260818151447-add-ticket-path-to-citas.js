'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(`
    ALTER TABLE citas ADD COLUMN ticket_path VARCHAR(255) NULL DEFAULT NULL;
  `);
};

exports.down = function(db) {
  return db.runSql(`
    ALTER TABLE citas DROP COLUMN ticket_path;
  `);
};

exports._meta = {
  "version": 1
};
