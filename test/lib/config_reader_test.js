/* eslint-env mocha */
'use strict';

const chai = require('chai');
const assert = chai.assert;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const subject = require('../../lib/config_reader').create('fixtures/config.json');

describe('configReader', () => {
  describe('#get', () => {
    context('with an invalid config variable', () => {
      it('throws an error', () => {
        return assert.throws(() => subject.get('publisher:channel'));
      });
    });

    context('woth a valid config variable', () => {
      it('returns the requested variable', () => {
        return assert.equal(subject.get('publisher:slack:team_token'), 'TxTESTTKN');
      });
    });
  });
});
