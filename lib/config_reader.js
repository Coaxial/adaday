'use strict';

const nconf = require('nconf');
const debug = require('debug')('configReader');

const configReader = function configReader(config_file_path) {
  nconf.file(config_file_path);
  debug(`loaded config '${config_file_path}'`);

  const get = function get(var_name) {
    const config_var = nconf.get(var_name);
    if (!config_var) {
      // this is to avoid embarrassing `undefined`s when a variable is
      // interpolated within a string
      throw new Error(`The variable '${var_name}' is not defined in the ` +
        `file '${config_file_path}'`);
    }
    return config_var;
  };

  return {
    get: get
  };
};

module.exports = {
  create: configReader
};
