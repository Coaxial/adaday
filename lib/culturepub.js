"use strict";

const Promise = require('bluebird');
const rp = require('request-promise');
const changeCase = require('change-case');

const CulturePub = () => {
  const randomId = function randomId() {
    // From poking around, the lowest id is 100 and goes up to 5 figures. The
    // max is around 24,000 at the moment but I assume it will go all the way
    // to 99,999 eventually
    const min = 60;
    const max = 99999; // 99,999
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const getAdMetadata = (id) => {
    return rp(`http://api.cbnews.webtv.flumotion.com/pods/${id}?extended=true`)
      .then((ad_metadata) => {
        return ad_metadata;
      })
      .catch(function handleError(err) {
        if (err.statusCode === 404) {
          // the id doesn't exist
          return getAdMetadata(randomId());
        }
        throw new Error(err);
      })
  };

  return {
    getAd: Promise.method(function getAd() {
      return getAdMetadata(randomId())
        .then(function responseToJson(api_response) {
          return JSON.parse(api_response);
        })
        .then(function pickMetadata(json_metadata) {
          const advertiser_name = json_metadata.extra_fields[6].value;
          const ad_country = json_metadata.extra_fields[2].value;
          const ad_year = json_metadata.extra_fields[13].value;
          const ad_agency = json_metadata.extra_fields[11].value;
          const ad_director = changeCase.titleCase(json_metadata.extra_fields[12].value);
          const ad_title = json_metadata.title;
          const video_filename = json_metadata.uri.match(/[\d_]+/);
          const video_url = `http://wpc.cf8d.edgecastcdn.net/80CF8D/cbnews/video/mp4/hd/${video_filename}.mp4`;

          const formatted_metadata = {
            video_url: video_url,
            advertiser_name: advertiser_name,
            ad_country: ad_country,
            ad_year: ad_year,
            ad_agency: ad_agency,
            ad_director: ad_director,
            ad_title: ad_title
          };

          return formatted_metadata;
        })
        .catch(function handleError(err) {
          throw new Error(err);
        });
    })
  };
};

module.exports = {
  create: CulturePub
};
