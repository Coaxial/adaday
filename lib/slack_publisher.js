'use strict';

const config_file_path = 'config.json';
const Promise = require('bluebird');
const rp = require('request-promise');
const debug = require('debug')('slackPublisher');
const configReader = require('./config_reader').create(config_file_path);

const slackPublisher = function slackPublisher() {
  const slack_hooks_endpoint = 'https://hooks.slack.com/services';

  const slackTokenUri = function slackTokenUri() {
    const team_token = configReader.get('publisher:slack:team_token');
    const service_token = configReader.get('publisher:slack:service_token');
    const auth_token = configReader.get('publisher:slack:auth_token');
    const token_uri = `/${team_token}/${service_token}/${auth_token}`;

    return token_uri;
  };

  const buildPayload = function buildPayload(ad) {
    const message_text = "Today's random ad is now available, watch it while it's hot!\n_Bot by @pierre, source code: <https://github.com/coaxial/adaday>._";
    const icon_emoji = ':tv:';
    const attachment_title = `${ad.advertiser_name}: ${ad.ad_title}`;
    const attachment_link = `${ad.video_url}`;
    const attachment_text = `Originally aired in ${ad.ad_year}, in ${ad.ad_country}. Directed by ${ad.ad_director}, created by ${ad.ad_agency}.`;
    const channel = configReader.get('publisher:slack:channel');
    const username = 'AdADay';

    const payload = {
      channel: channel,
      username: username,
      text: message_text,
      icon_emoji: icon_emoji,
      attachments: [
        {
          title: attachment_title,
          title_link: attachment_link,
          text: attachment_text
        }
      ]
    }

    return payload;
  };

  const postHook = Promise.method(function postHook(ad) {
    const slack_token_uri = slackTokenUri();
    const hooks_url = slack_hooks_endpoint + slack_token_uri;
    const payload = buildPayload(ad);

    const options = {
      method: 'POST',
      uri: hooks_url,
      json: payload
    };

    return rp(options)
      .then((response) => {
        debug(`Slack API responded with '${response}'`);
        return payload;
      })
      .catch((err) => {
        throw new Error(`'${slack_hooks_endpoint}' responded with '${err}'`);
      });
  });

  //
  // Public methods
  //
  return {
    publishAd: Promise.method(function publishAd(ad) {
      return postHook(ad);
    })
  };
};

module.exports = {
  create: slackPublisher
};
