"use strict";

const config_file_path = 'config.json';
const Promise = require('bluebird');
const rp = require('request-promise');
const changeCase = require('change-case');
const moment = require('moment-timezone');
const debug = require('debug')('culturePub');
const removeDiacritics = require('diacritics').remove;
const configReader = require('./config_reader.js').create(config_file_path);

const culturePub = () => {
  const FIELD_NAME = {
    brand: 'Marque',
    country: 'Pays',
    year: 'Année',
    agency: 'Agence',
    role: 'Rôle',
    product: 'Produit'
  };

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

  const getAdMetadata = function getAdMetadata(id) {
    const uri = `http://api.cbnews.webtv.flumotion.com/pods/${id}?extended=true`;
    debug(`Fetching '${uri}'`);

    return rp(uri)
      .then(function parseToJson(ad_metadata) {
        return JSON.parse(ad_metadata);
      })
      .then(function checkAdValidity(json_metadata) {
        if (isAnAd(json_metadata)) {
          return Promise.resolve(json_metadata);
        }
        debug(`Not a valid ad`);
        return getAdMetadata(randomId());
      })
      .then(function checkScore(ad_metadata) {
        const scoreAboveThreshold = scoreIsAboveThreshold(ad_metadata);
        if (!scoreAboveThreshold) {
          debug('Score below minimum');
          return getAdMetadata(randomId());
        }
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
    data_match = data_match[0] && data_match[0].value;
    return data_match;
  };

  const extractFilename = function extractFilename(json_metadata) {
    const field_name = 'OriginalFilename';
    let filename_match = json_metadata.filter((item) => item.name === field_name);
    filename_match = (filename_match[0] && filename_match[0].value);
    filename_match = filename_match.match(/[\d_]+/);
    return filename_match;
  };

  const propertyToSlug = function propertyToSlug(json_metadata, field) {
    const property = extractValue(json_metadata, field);
    let slug;
    if (property) {
      slug = removeDiacritics(property);
      slug = changeCase.paramCase(slug);
    } else {
      slug = '';
    }

    return slug;
  };

  const buildImageUrl = function buildThumbnailUrl(json_metadata) {
    const extra_fields = json_metadata.extra_fields;
    const ad_id = json_metadata.id;
    const ad_name = removeDiacritics(changeCase.paramCase(json_metadata.title));
    const advertiser_name = propertyToSlug(extra_fields, FIELD_NAME.brand);
    const product_name = propertyToSlug(extra_fields, FIELD_NAME.product);
    const publish_date = moment(json_metadata.publishDate);
    let publish_year;
    let publish_month;

    // It seems some entries' thumbnails were all added at the same time, in
    // October 2014. The later ones get their actual publishing dates.
    if (publish_date.isSameOrBefore('2014-10-31')) {
      publish_year = '2014';
      publish_month = '10';
    } else {
      publish_year = publish_date.format('YYYY');
      publish_month = publish_date.format('MM');
    }

    let image_url;

    if (product_name) {
      image_url = `http://static.culturepub.fr/assets/${publish_year}/${publish_month}/poster-${ad_id}-${advertiser_name}-${product_name}-${ad_name}-236x132.jpg`;
    } else {
      image_url = `http://static.culturepub.fr/assets/${publish_year}/${publish_month}/poster-${ad_id}-${advertiser_name}-${ad_name}-236x132.jpg`;
    }

    debug(`image_url: '${image_url}'`)
    return image_url;
  };

  const isAnAd = function isAnAd(json_metadata) {
    // It seems every ad has a brand property, other videos don't; this is how
    // we can tell whether it's an ad
    const extra_fields = json_metadata.extra_fields;
    const advertiser_name = extractValue(extra_fields, FIELD_NAME.brand);
    return !!advertiser_name;
  };

  const scoreIsAboveThreshold = function scoreIsAboveThreshold(json_metadata) {
    const votes_count = json_metadata.total_rates;
    // Some ads are good but come up with a rating of 0 because they have no
    // votes.
    const allow_voteless = true;
    const score = parseFloat(json_metadata.average_rate, 10);
    const min_score = parseInt(configReader.get('culturepub:min_score'), 10);

    debug(`Ad score is ${score}, at least ${min_score} is required`);
    if (allow_voteless) {
      debug(`Low score threshold overriden by lack of votes`)
    }

    return (min_score <= score) || (votes_count === 0 && allow_voteless);
  };

  return {
    getAd: Promise.method(function getAd() {
      return getAdMetadata(randomId())
        .then(function pickMetadata(json_metadata) {
          const extra_fields = json_metadata.extra_fields;
          const advertiser_name = extractValue(extra_fields, FIELD_NAME.brand);
          const ad_country = extractValue(extra_fields, FIELD_NAME.country);
          const ad_year = extractValue(extra_fields, FIELD_NAME.year);
          const ad_agency = extractValue(extra_fields, FIELD_NAME.agency);
          const ad_director = changeCase.titleCase(extractValue(extra_fields, FIELD_NAME.role));
          
          const ad_title = json_metadata.title;
          const video_filename = extractFilename(extra_fields);
          const video_url = `http://wpc.cf8d.edgecastcdn.net/80CF8D/cbnews/video/mp4/hd/${video_filename}.mp4`;
          const image_url = buildImageUrl(json_metadata);

          const formatted_metadata = {
            video_url: video_url,
            image_url: image_url,
            advertiser_name: advertiser_name,
            ad_country: ad_country,
            ad_year: ad_year,
            ad_agency: ad_agency,
            ad_director: ad_director,
            ad_title: ad_title
          };

          debug(`formatted_metadata: ${JSON.stringify(formatted_metadata, null, 4)}`);

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
