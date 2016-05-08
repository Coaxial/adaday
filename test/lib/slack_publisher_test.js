/* eslint-env mocha */
'use strict';

const testHelper = require('../test_helper').create();
const chai = require('chai');
const assert = chai.assert;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const proxyquire = require('proxyquire');
const nock = require('nock');

const subject = proxyquire(
  '../../lib/slack_publisher.js', {
    './config_reader': testHelper.mocks.configReader.weekdays
  }
).create();

describe('slackPublisher', () => {
  describe('#publishAd', () => {
    let test_ad;

    beforeEach(function assignTestAd() {
      test_ad = {
        video_url: 'https://example.com/video.mp4',
        image_url: 'http://example.com/image.jpg',
        advertiser_name: 'Test brand',
        ad_title: 'Test ad',
        ad_country: 'Testlandia',
        ad_year: '1998',
        ad_director: 'Test Mctesty',
        ad_agency: 'Test agency'
      };
    });

    afterEach(function cleanNock() {
      nock.cleanAll();
    });

    context('with an unsuccessful request', () => {
      beforeEach(function mockApi() {
        const api_host = 'https://hooks.slack.com';
        // example endpoint format:
        // /services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
        // cf https://api.slack.com/incoming-webhooks
        const endpoint_regex = /services\/T[a-z0-9]{8}\/B[a-z0-9]{8}\/[a-z0-9]{24}/i;
        const matchAnyRequestBody = () => true;
        const HTTP_INTERNAL_ERROR = 500;

        nock(api_host)
          .post(endpoint_regex, matchAnyRequestBody)
          .reply(HTTP_INTERNAL_ERROR, 'Internal server error');
      });

      it('throws with a diagnostic message', () => {
        return assert.isRejected(subject.publishAd(test_ad), /hooks\.slack\.com.*500.*Internal server error/);
      });
    });

    context('with a successful request', () => {
      beforeEach(function mockApi() {
        const api_host = 'https://hooks.slack.com';
        // example endpoint format:
        // /services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
        // cf https://api.slack.com/incoming-webhooks
        const endpoint_regex = /services\/T[a-z0-9]{8}\/B[a-z0-9]{8}\/[a-z0-9]{24}/i;
        const matchAnyRequestBody = () => true;
        const HTTP_OK = 200;

        nock(api_host)
          .post(endpoint_regex, matchAnyRequestBody)
          .reply(HTTP_OK, 'ok');
      });

      it('returns the Slack webhook payload', () => {
        const expected_payload = {
          channel: '#test',
          username: 'AdADay',
          text: "Today's random ad has been chosen, watch it while it's hot!\n_<https://github.com/coaxial/adaday|source code>_",
          icon_emoji: ':tv:',
          attachments: [
            {
              title: 'Test brand: Test ad',
              title_link: 'https://example.com/video.mp4',
              text: 'Originally aired in 1998, in Testlandia. Directed by Test Mctesty. Created by Test agency.',
              image_url: 'http://example.com/image.jpg'
            }
          ]
        };

        return subject.publishAd(test_ad)
          .then((actual_payload) => {
            return assert.deepEqual(actual_payload, expected_payload);
          });
      });

      context('with "Unknown" properties', () => {
        it('does not include them', () => {
          const expected_payload = {
            channel: '#test',
            username: 'AdADay',
            text: "Today's random ad has been chosen, watch it while it's hot!\n_<https://github.com/coaxial/adaday|source code>_",
            icon_emoji: ':tv:',
            attachments: [
              {
                title: 'Test brand: Test ad',
                title_link: 'https://example.com/video.mp4',
                text: '',
                image_url: 'http://example.com/image.jpg'
              }
            ]
          };

          const unknown_props_ad = {
            video_url: 'https://example.com/video.mp4',
            image_url: 'http://example.com/image.jpg',
            advertiser_name: 'Test brand',
            ad_title: 'Test ad',
            ad_country: '',
            ad_year: '',
            ad_director: '',
            ad_agency: ''
          };

          return subject.publishAd(unknown_props_ad)
          .then((actual_payload) => {
            return assert.deepEqual(actual_payload, expected_payload);
          });
        });
      });
    });
  });
});
