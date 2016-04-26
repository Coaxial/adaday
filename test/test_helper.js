'use strict';

const orig_configReader = require('../lib/config_reader');

const testHelper = function testHelper() {
  // 
  // mocks definition
  // 
  const configReader = {
    create: function mockedCreate() {
      // The config file is excluded from git commits, this causes an error
      // when trying to read it during testing.
      return orig_configReader.create('fixtures/config.json');
    }
  };

  // 
  // enabled mocks
  //
  return {
    mocks: {
      configReader: configReader
    }
  };
};

module.exports = {
  create: testHelper
};
