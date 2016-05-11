[![Build Status](https://travis-ci.org/Coaxial/adaday.svg?branch=master)](https://travis-ci.org/Coaxial/adaday) ![Node v4 ready](https://img.shields.io/badge/node-v4-brightgreen.svg) ![Node v6 ready](https://img.shields.io/badge/node-v6-brightgreen.svg)
# :tv: AdADay

Selects a random video ad daily from a curated list and posts it to Slack.

## Features

- Customizable posting time & days
- Embedded thumbnails for video ads when publishing to Slack
- 100% test coverage
- Modular and extensible design
- Ads filtering based on viewers' ratings

## Getting started

- Copy the example configuration file `config.json.example` and save it as
`config.json`.
- Get your tokens from
[Slack](https://my.slack.com/services/new/incoming-webhook/) and copy them into
the `config.json` file.
- Set your timezone, the days, and the time when AdADay should post to Slack.
- The possible values for `publish_on` are `weekdays` or `anyday`.
- `publish_at` is the time when the ad will be posted. Any time in 24h format
written as `hh:mm` can be set.
- The `timezone` will be used to interpret the `publish_at` time entered. A list
of timezones is available [here](http://momentjs.com/timezone/).
- The `min_score` setting is the cut-off value under which the ad is rejected.
Scores range from `0` to `5`. Valid values are `0`, `1`, `2`, `3`, `4`, `5`.
The more recent videos have a score of 0.0 or 5.0; it seems there used to be a
way to give a 1 to 5 stars rating to ads before that went away with a newer
version of the website. It is only possible to "like" a video now, giving a
rating of 5.0 without any granularity.

You will need NodeJS 4 or 6 (get it [here](https://nodejs.org/en/). Install the
dependencies with `npm i` and run the app with `npm start`. As long as the app
is running, it will post a new ad daily at the specified time.

> To run with the full debug output, start the app with `DEBUG=* node index.js`

## Running the tests

AdADay has been tested against NodeJS 4 LTS and NodeJS 6.

Install gulp with `npm i -g gulp` and run `npm test`. Code coverage data is
available with `gulp cov`.

The Gulp task also generates HTML coverage reports at
`coverage/lcov-report/index.html`

## Technical details

### Overview

AdADay relies on the [culturepub.fr](culturepub.fr) database. It selects an ad
using a random ID and uses culturepub's unofficial API to retrieve its
metadata.

The relevant metadata is extracted and formatted for the Slack module to
consume using Slack's [webhooks API](https://api.slack.com/incoming-webhooks).

AdADay will check if the weekday and the time match the settings from
`config.json` at regular intervals (every 59 seconds).

When the current time matches the setting in `config.json`, AdADay will fetch
an ad and post it to Slack.

I used promises with Bluebird and the modules are all factories. I prefer
factories over prototypes because they allow truly private methods/variables
and don't require the use of the `new` keyword.

### Modules

#### Culture Pub ([lib/culture_pub.js](lib/culturepub.js))

Communicates with the unofficial culturepub.fr API.

It generates a random ID between 60 (the lowest valid ad ID according to my
empirical research) and 99999 (which I assume is the maximum possible ID ever
since they are 5 digits long).

The API is queried for the metadata matching that ID.

Because the latest valid ID is somewhere around 22,000 at the time of writing,
I check whether the API returns a 200 HTTP code or a 404. In case of a 404, I
assume the ID doesn't exist yet and retry for another random one. I could use a
binary search to minimize the number of API hits but the extra second or two it
takes to get a valid id isn't a problem yet, and the API isn't rate limited.

Some IDs aren't actual ads; they're test dummies or episodes of the show. To
filter them out, I search the metadata for properties that I (empirically)
found to be unique to bona fide ads.

Once a valid ID has been found, the relevant metadata is extracted and assembled into an object for a publisher to consume.

#### Slack Publisher ([lib/slack_publisher.js](lib/slack_publisher.js))

Deals with the Slack webhook API.

It turns the object from the `culturepub` module into a valid Slack
payload. The payload is then posted to Slack's incoming-webhook endpoint.

Some ads have more complete metadata than others. To avoid displaying missing
metadata, the module assembles a text snippet based only on the available data.

#### Config Reader ([lib/config_reader.js](lib/config_reader.js))

Extracts the options set in the `config.json` file.

I am using [nconf](https://npmjs.com/package/nconf) to read from a JSON
file. I wanted to isolate this dependency to make testing easier by injecting
config files from fixtures with
[proxyquire](https://npmjs.com/package/proxyquire); I figured the easiest
would be to wrap it in a module. It also makes it easier to replace nconf by
something else should the need arise.

I wanted to validate the config file at loading time, in an effort to lint it
and avoid the app crashing when fetching a missing option. However,
maintainability would be problematic; I didn't want to keep a copy of the
schema in the code.

Instead, I throw an error if the app tries to fetch a configuration option that
isn't set in the file. Since every setting is mandatory, it is acceptable for
the app to crash on a missing option instead of inserting `undefined`s.

#### AdADay ([lib/adaday.js](lib/adaday.js))

Checks if the current time matches the time set in `config.json`, fetches an ad
via the `culturepub` modules and posts it via the `slack_publisher` module.

I didn't use a cron job because I want the app to be self contained, portable
and easy to run anywhere.

Polling the current time very minute isn't too elegant. A smarter way would be
to calculate the interval until the configured time and set a timer for that
interval instead.

## Contributing

Open issues on GitHub, pull requests should be thoroughly tested, use strict
mode, promises and factories.

## License

MIT License

Copyright (c) 2016 Coaxial

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
