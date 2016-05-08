'use strict';

const config_file_path = 'config.json';
const Promise = require('bluebird');
const rp = require('request-promise');
const debug = require('debug')('slackPublisher');
const debugApp = require('debug')('app');
const configReader = require('./config_reader.js').create(config_file_path);

const slackPublisher = function slackPublisher() {
  const slack_hooks_endpoint = 'https://hooks.slack.com/services';

  const slackTokenUri = function slackTokenUri() {
    const team_token = configReader.get('publisher:slack:team_token');
    const service_token = configReader.get('publisher:slack:service_token');
    const auth_token = configReader.get('publisher:slack:auth_token');
    const token_uri = `/${team_token}/${service_token}/${auth_token}`;

    return token_uri;
  };

  const buildText = function buildText(ad) {
    const aired_year = `in ${ad.ad_year}, `;
    const aired_country = `in ${ad.ad_country}. `;
    const directed_by = `Directed by ${ad.ad_director}. `;
    const created_by = `Created by ${ad.ad_agency}.`;
    let attachment_text = '';

    if (ad.ad_year || ad.ad_country) {
      attachment_text += `Originally aired `;
    }
    if (ad.ad_year) {
      attachment_text += `${aired_year}`;
    }
    if (ad.ad_country) {
      attachment_text += `${aired_country}`;
    }
    if (ad.ad_director) {
     attachment_text += `${directed_by}`;
    }
    if (ad.ad_agency) {
     attachment_text += `${created_by}`;
    }

    return attachment_text;
  };

  const buildPayload = function buildPayload(ad) {
    const disclaimer = "_Note: while this ad has been shown on " +
      "mainstream media, it was randomly chosen and wasn't reviewed; " +
      "viewer discretion is advised._ " +
      "_This isn't an endorsement nor a condonation of the products, brands, " +
      "messages, ideas, groups, or actions implicitly or explicitly depicted " +
      "within the ad._\n";
    const contribute_message = "_<https://github.com/coaxial/adaday|Source " +
      "code available>, please consider contributing._\n";
    const message_text = "Today's random ad is here!\n" +
      contribute_message;
    const icon_emoji = ':tv:';
    const attachment_title = `${ad.advertiser_name}: ${ad.ad_title}`;
    const attachment_text = `${buildText(ad)}\n${disclaimer}`;
    const attachment_link = ad.video_url;
    const image_url = ad.image_url;
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
          text: attachment_text,
          image_url: image_url,
          mrkdwn_in: ['text']
        }
      ]
    }

    debug(`payload being sent to Slack: ${JSON.stringify(payload, null, 4)}`);

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
        debugApp('Ad successfully posted to Slack');
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
