"use strict";

const Promise = require('bluebird');
const rp = require('request-promise');
const changeCase = require('change-case');
const debug = require('debug')('culturePub');

const culturePub = () => {
  const randomId = function randomId() {
    // From poking around, the lowest id is 100 and goes up to 5 figures. The
    // max is around 24,000 at the moment but I assume it will go all the way
    // to 99,999 eventually
    const min = 60;
    const max = 99999; // 99,999
    const id = Math.floor(Math.random() * (max - min + 1)) + min;
    debug(`Random id: ${id}`);
    return id;
  };

  const getAdMetadata = (id) => {
    const uri = `http://api.cbnews.webtv.flumotion.com/pods/${id}?extended=true`;
    debug(`Fetching '${uri}'`);

    return rp(uri)
      .then((ad_metadata) => {
        return ad_metadata;
      })
      .catch(function handleError(err) {
        if (err.statusCode === 404) {
          debug("Ad doesn't exist");
          return getAdMetadata(randomId());
        }
        throw new Error(err);
      })
  };

  const extractValue = function extractValue(json_metadata, field) {
    const field_regex = new RegExp(field);
    let data_match = json_metadata.filter((item) => item.name.match(field_regex));
    data_match = (data_match[0] && data_match[0].value) || 'Unknown';
    return data_match;
  };

  return {
    getAd: Promise.method(function getAd() {
      return getAdMetadata(randomId())
        .then(function responseToJson(api_response) {
          return JSON.parse(api_response);
        })
        .then(function pickMetadata(json_metadata) {
          const extra_fields = json_metadata.extra_fields;
          const advertiser_name = extractValue(extra_fields, 'Marque');
          const ad_country = extractValue(extra_fields, 'Pays');
          const ad_year = extractValue(extra_fields, 'Année');
          const ad_agency = extractValue(extra_fields, 'Agence');
          const ad_director = changeCase.titleCase(extractValue(extra_fields, 'Rôle'));
          
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

          debug(`Got ad: '${ad_title}'`);
          return formatted_metadata;
        })
        .catch(function handleError(err) {
          throw new Error(err);
        });
    })
  };
};

module.exports = {
  create: culturePub
};
