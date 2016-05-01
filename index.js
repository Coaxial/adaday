'use strict';

const debug = require('debug')('app');
const adADay = require('./lib/adaday.js').create();

const runBot = function runBot() {
  debug('AdADay started');
  debug('Waiting for the right moment to post');
  return adADay.run();
}

runBot();
