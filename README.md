[![Build Status](https://travis-ci.org/Coaxial/adaday.svg?branch=master)](https://travis-ci.org/Coaxial/adaday) ![Node v4 ready](https://img.shields.io/badge/node-v4-brightgreen.svg) ![Node v6 ready](https://img.shields.io/badge/node-v6-brightgreen.svg)
# :tv: AdADay

Selects a random ad daily from a curated list and posts it to Slack.

## Getting started

Copy the example configuration file `config.json.example` and save it as
`config.json`.

Get your tokens from
[Slack](https://my.slack.com/services/new/incoming-webhook/) and copy them into
the `config.json` file.


Set your timezone, the days, and the time when AdADay should post to Slack.

The possible values for `publish_on` are `weekdays` or `anyday`.

`publish_at` is the time when the ad will be posted. Any time in 24h format
written as `hh:mm` can be set.

The `timezone` will be used to interpret the `publish_at` time entered. A list
of timezones is available [here](http://momentjs.com/timezone/).

The `min_score` setting is the cut-off value under which the ad is rejected.
Scores range from `0` to `5`. Valid values are `0`, `1`, `2`, `3`, `4`, `5`.
The more recent videos have a score of 0.0 or 5.0; it seems there used to be a
way to give a 1 to 5 stars rating to ads before that went away with a newer
version of the website. It is only possible to "like" a video now, giving a
rating of 5.0 without any granularity.

You will need NodeJS (get it [here](https://nodejs.org/en/). Install the
dependencies with `npm i` and run the app with `npm start`. As long as the app
is running, it will post a new ad daily at the specified time.

> To run with the full debug output, start the app with `DEBUG=* node index.js`

## Running the tests

AdADay has been tested against NodeJS 4 LTS and NodeJS 6.

Install gulp with `npm i -g gulp` and run `npm test`. Code coverage data is
available with `gulp cov`. 100% of the code is covered by tests at the time of
writing.

## Technical details

### Overview

AdADay relies on the curated video ads database from culturepub.fr. It selects
a random ID and uses the unofficial API to retrieve the metadata to the
corresponding ad.

Then it builds a message with nicely formatted information about the ad and
posts it to Slack using the [webhook
API](https://api.slack.com/incoming-webhooks).

AdADay will check if the weekday and the time match the settings from
`config.json` at regular intervals (every 59 seconds at the time of writing).

### Modules

#### [Culture Pub](lib/culturepub.js)

Handles the communication with the unofficial culturepub.fr API.

It generates a random ID between 60 (the lowest valid ad ID according to my
empirical research) and 99999 (which I assume is the maximum possible ID ever
since it is 5 digits long).

The API is queried with this id to get that ad's metadata.

Because the latest valid ID is somewhere around 22,000 at the time of writing,
I check whether the API returns a 200 HTTP code or a 404. In case of a 404, I
assume the ID doesn't exist yet and I just retry for another random one. I
could use a binary search to minimize the number of API hits but the extra
second or two it takes to get a valid id isn't a problem yet, and the API
doesn't seem to be rate limited.

Some results are episodes of the show or test dummies. I filter them out and
get a new one if I detect the result isn't an ad. This is done by checking
whether a property that I (empirically) found only to exist on valid ads is
present.

Once a valid ID has been found, the metadata is formatted into an ad object and
returned for a publisher to consume.


#### [Slack Publisher](lib/slack_publisher.js)

Deals with the Slack webhook API.

It formats the ad object returned from the culturepub module and turns it into
a Slack payload to be posted to the incoming-webhook endpoint.

#### [Config Reader](lib/config_reader.js)

Reads the options set in the `config.json` file.

I am using [nconf](https://npmjs.com/package/nconf) to read from a JSON
file. I wanted to isolate this dependency to make testing easier by injecting
config files from fixtures with
[proxyquire](https://npmjs.com/package/proxyquire) and I figured the easiest
would be to package it in a module. It also makes it easier to replace nconf by
something else should the need arise.

I wanted to validate the config file at loading time, in an effort to lint the
config file and avoid the app crashing when fetching a missing option. However,
this would have proved hard to maintain, I didn't want to keep a copy of the
schema in the code. Instead, I throw an error if the app tries to fetch a
configuration option that doesn't exist in the file. It is not as upfront as
linting the file when loading it but it still crashes the app when calling an
undefined option, forcing the user to correct the situation. Things
interpolated as `undefined` can be harder to detect than if the app fails right
away.

#### [AdADay](lib/adaday.js)

Checks if the time is right to get an ad from culturepub and publish in to
Slack.

I wanted to avoid running the app in a cron job, and keep the days and time
configuration within a JSON file. It is easier to modify and easier to run
without depending on cron. It also makes it cross-platform.

## License

MIT License

Copyright (c) 2016 Coaxial <py@poujade.org>

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
