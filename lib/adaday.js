'use strict';

const Promise = require('bluebird');
const moment = require('moment-timezone');
const debugTime = require('debug')('AdADay:time_matching');
const culturePub = require('./culturepub.js').create();
const slackPublisher = require('./slack_publisher.js').create();
const configReader = require('./config_reader.js').create('config.json');

const adADay = function adADay() {
  moment.tz.setDefault(configReader.get('app:timezone'));
  const isDayMatch = function isTimeToPublish() {
    const DAY_IDS = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7
    };
    const now = moment();
    const publish_on = configReader.get('app:publish_on');

    debugTime(`Target days are ${publish_on}`);
    debugTime(`Current day is ${moment().format('dddd')}`);

    if (publish_on === 'weekdays') {
      const isAfterSunday = (now.isoWeekday() >= DAY_IDS['Monday']);
      const isBeforeSaturday = (now.isoWeekday() <= DAY_IDS['Friday']);

      if (isAfterSunday && isBeforeSaturday) {
        debugTime('Weekday match');
      } else {
        debugTime('Not a weekday');
      }

      return isAfterSunday && isBeforeSaturday;
    }

    debugTime('Anyday match');
    return true;
  };

  const isTimeMatch = function isTimeMatch() {
    const now = moment();
    const publish_at = moment(configReader.get('app:publish_at'), 'HH:mm');
    const isHour = now.isSame(publish_at, 'hour');
    const isMinute = now.isSame(publish_at, 'minute');

    debugTime(`Target time is ${publish_at.format('HH:mm')}`);
    debugTime(`Current time is ${moment().format('HH:mm')}`);

    if (isHour && isMinute) {
      debugTime('Time match');
    } else {
      debugTime('No time match');
    }

    return isHour && isMinute;
  };

  const isTimeToPublish = function isTimeToPublish() {
    return isDayMatch() && isTimeMatch();
  };

  const getAd = Promise.method(function getAd() {
    if (isTimeToPublish()) {
      debugTime('Time to publish!');
      return culturePub.getAd()
        .then((ad_data) => slackPublisher.publishAd(ad_data));
    }

    debugTime('Not time yet');
    return null;
  });

  const run = Promise.method(function run() {
    const sleep_duration = 60000; // ms
    return getAd()
      .then(setInterval(getAd, sleep_duration));
  });

  return {
    run: run
  }
};

module.exports = {
  create: adADay
};
