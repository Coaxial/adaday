/* eslint-env  mocha */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const proxyquire = require('proxyquire');
const tk = require('timekeeper');

let testHelper;
let subject;

describe('adADay', () => {
  const weekday = {
    right_time: new Date(1461591000000), // Monday 9:30am
    wrong_time: new Date(1461605400000) // Monday 1:30pm
  };

  const weekend = {
    right_time: new Date(1462023000000), // Saturday 9:30am
    wrong_time: new Date(1462037400000) // Saturday 1:30pm
  };

  beforeEach(function loadMocks() {
    testHelper = require('../test_helper.js').create();
    subject = proxyquire('../../lib/adaday.js', {
      './culturepub.js': testHelper.mocks.culturePub,
      './slack_publisher.js': testHelper.mocks.slackPublisher,
      // NOTE: using the weekdays config file fixture
      './config_reader.js': testHelper.mocks.configReader.weekdays
    }).create();
  });

  afterEach(function unloadMocks() {
    testHelper = undefined;
    subject = undefined;
  });

  afterEach(function resetTime() {
    tk.reset();
  });

  context('when set to publish on weekdays', () => {
    context('when time to publish', () => {
      context('during a weekday', () => {
        beforeEach(function freezeTime() {
          tk.freeze(weekday.right_time);
        });

        it('requests an ad', () => {
          return subject.run()
            .then(() => {
              return assert.isTrue(testHelper.spies.culturePub.getAd.called);
            });
        });

        it('publishes an ad', () => {
          return subject.run()
            .then(() => {
              return assert.isTrue(testHelper.spies.slackPublisher.publishAd.called);
            });
        });

        it('publishes an ad only once', () => {
          return subject.run()
            .then(() => {
              return assert.isTrue(testHelper.spies.slackPublisher.publishAd.calledOnce);
            });
        });
      });

      context('during the weekend', () => {
        beforeEach(function freezeTime() {
          tk.freeze(weekend.right_time);
        });
        
        it('does not request an ad', () => {
          return subject.run()
            .then(() => {
              return assert.isFalse(testHelper.spies.culturePub.getAd.called)
            });
        });

        it('does not publish an ad', () => {
          return subject.run()
            .then(() => {
              return assert.isFalse(testHelper.spies.slackPublisher.publishAd.called)
            });
        });
      });
    });

    context('when not time to publish', () => {
      beforeEach(function freezeTime() {
        tk.freeze(weekday.wrong_time);
      });

      it('does not request an ad', () => {
        return subject.run()
          .then(() => {
            return assert.isFalse(testHelper.spies.culturePub.getAd.called);
          });
      });

      it('does not publish an ad', () => {
        return subject.run()
          .then(() => {
            return assert.isFalse(testHelper.spies.slackPublisher.publishAd.called);
          });
      });
    });
  });

  context('when set to publish everyday', () => {
    beforeEach(function loadMocks() {
      testHelper = require('../test_helper.js').create();
      subject = proxyquire('../../lib/adaday.js', {
        './culturepub.js': testHelper.mocks.culturePub,
        './slack_publisher.js': testHelper.mocks.slackPublisher,
        // NOTE: using the anyday config file fixture
        './config_reader.js': testHelper.mocks.configReader.anyday
      }).create();
    });

    context('when time to publish', () => {
      beforeEach(() => {
        tk.freeze(weekend.right_time);
      });

      it('publishes on weekdays', () => {
        return subject.run()
          .then(() => {
            return assert.isTrue(testHelper.spies.slackPublisher.publishAd.called)
          });
      });

      it('publishes on weekends', () => {
        return subject.run()
        .then(() => {
          return assert.isTrue(testHelper.spies.slackPublisher.publishAd.called)
        });
      });
    });
  });
});
