'use strict';

const sinon = require('sinon');
const nock = require('nock');
const Promise = require('bluebird');
const orig_configReader = require('../lib/config_reader');
nock.disableNetConnect();

const testHelper = function testHelper() {
  // 
  // stub objects etc
  //
  const stub_ad = {
    video_url: 'https://example.com/video.mp4',
    advertiser_name: 'Test brand',
    ad_title: 'Test ad',
    ad_country: 'Testlandia',
    ad_year: '1998',
    ad_director: 'Test Mctesty',
    ad_agency: 'Test agency'
  };

  const stub_payload = {
    channel: '#test',
    username: 'AdADay',
    text: "Today's random ad is now available, watch it while it's hot!\n_Bot by @pierre, source code: <https://github.com/coaxial/adaday>._",
    icon_emoji: ':tv:',
    attachments: [
      {
        title: 'Test brand: Test ad',
        title_link: 'https://example.com/video.mp4',
        text: 'Originally aired in 1998, in Testlandia. Directed by Test Mctesty, created by Test agency.'
      }
    ]
  };
  // 
  // spies definition
  // 
  const spies = {
    culturePub: {
      getAd: sinon.stub().returns(Promise.resolve(stub_ad))
    },
    slackPublisher: {
      publishAd: sinon.stub().returns(Promise.resolve(stub_payload))
    }
  };

  // 
  // mocks definition
  // 
  const mocks = {
    configReader: {
      weekdays: {
        create: function mockedCreate() {
          // The config file is excluded from git commits, this causes an error
          // when trying to read it during testing.
          return orig_configReader.create('fixtures/config_weekdays.json');
        }
      },
      anyday: {
        create: function mockedCreate() {
          // The config file is excluded from git commits, this causes an error
          // when trying to read it during testing.
          return orig_configReader.create('fixtures/config_anyday.json');
        }
      }
    },
    culturePub: {
      create: function mockedCreate() {
        return {
          getAd: spies.culturePub.getAd
        };
      }
    },
    slackPublisher: {
      create: function mockedCreate() {
        return {
          publishAd: spies.slackPublisher.publishAd
        };
      }
    }
  };

  // 
  // exposed mocks & spies
  //
  return {
    mocks: mocks,
    spies: spies
  };
};

module.exports = {
  create: testHelper
};
