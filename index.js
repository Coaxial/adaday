'use strict';

const debug = require('debug')('app');
const adADay = require('./lib/adaday.js').create();

const runBot = function runBot() {
  debug('App started');
  return adADay.run();
}

runBot();
