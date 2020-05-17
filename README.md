# [The maintained successor of se-scraper is the general purpose crawling infrastructure](https://github.com/NikolaiT/Crawling-Infrastructure)

## Search Engine Scraper - se-scraper

[![npm](https://img.shields.io/npm/v/se-scraper.svg?style=for-the-badge)](https://www.npmjs.com/package/se-scraper)
[![Donate](https://img.shields.io/badge/donate-paypal-blue.svg?style=for-the-badge)](https://www.paypal.me/incolumitas)
[![Known Vulnerabilities](https://snyk.io/test/github/NikolaiT/se-scraper/badge.svg)](https://snyk.io/test/github/NikolaiT/se-scraper)

This node module allows you to scrape search engines concurrently with different proxies.

If you don't have extensive technical experience or don't want to purchase proxies, you can use [my scraping service](https://scrapeulous.com/).

#### Table of Contents
- [Installation](#installation)
- [Docker](#docker-support)
- [Minimal Example](#minimal-example)
- [Quickstart](#quickstart)
- [Contribute](#contribute)
- [Using Proxies](#proxies)
- [Custom Scrapers](#custom-scrapers)
- [Examples](#examples)
- [Scraping Model](#scraping-model)
- [Technical Notes](#technical-notes)
- [Advanced Usage](#advanced-usage)
- [Special Query String Parameters for Search Engines](#query-string-parameters)


Se-scraper supports the following search engines:
* Google
* Google News
* Google News App version (https://news.google.com)
* Google Image
* Bing
* Bing News
* Infospace
* Duckduckgo
* Yandex
* Webcrawler

This module uses puppeteer and a modified version of [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster/). It was created by the Developer of [GoogleScraper](https://github.com/NikolaiT/GoogleScraper), a module with 1800 Stars on Github.

## Installation

You need a working installation of **node** and the **npm** package manager.


For example, if you are using Ubuntu 18.04, you can install node and npm with the following commands:

```bash
sudo apt update;

sudo apt install nodejs;

# recent version of npm
curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh;
sudo bash nodesource_setup.sh;
sudo apt install npm;
```

Chrome and puppeteer [need some additional libraries to run on ubuntu](https://techoverflow.net/2018/06/05/how-to-fix-puppetteer-error-).

This command will install dependencies:

```bash
# install all that is needed by chromium browser. Maybe not everything needed
sudo apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget;
```

Install **se-scraper** by entering the following command in your terminal

```bash
npm install se-scraper
```

If you **don't** want puppeteer to download a complete chromium browser, add this variable to your environment. Then this module is not guaranteed to run out of the box.

```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
```

### Docker Support

I will maintain a public docker image of se-scraper. Pull the docker image with the command:

```bash
docker pull tschachn/se-scraper
```

Confirm that the docker image was correctly pulled:

```bash
docker image ls
```

Should show something like that:

```
tschachn/se-scraper             latest           897e1aeeba78        21 minutes ago      1.29GB
```

You can check the [latest tag here](https://hub.docker.com/r/tschachn/se-scraper/tags). In the example below, the latest tag is **latest**. This will most likely remain **latest** in the future.

Run the docker image and map the internal port 3000 to the external
port 3000:

```bash
$ docker run -p 3000:3000 tschachn/se-scraper:latest

Running on http://0.0.0.0:3000
```

When the image is running, you may start scrape jobs via HTTP API:

```bash
curl -XPOST http://0.0.0.0:3000 -H 'Content-Type: application/json' \
-d '{
    "browser_config": {
        "random_user_agent": true
    },
    "scrape_config": {
        "search_engine": "google",
        "keywords": ["test"],
        "num_pages": 1
    }
}'
```

Many thanks goes to [slotix](https://github.com/NikolaiT/se-scraper/pull/21) for his tremendous help in setting up a docker image.


## Minimal Example

Create a file named `minimal.js` with the following contents

```js
const se_scraper = require('se-scraper');

(async () => {
    let scrape_job = {
        search_engine: 'google',
        keywords: ['lets go boys'],
        num_pages: 1,
    };

    var results = await se_scraper.scrape({}, scrape_job);

    console.dir(results, {depth: null, colors: true});
})();
```

Start scraping by firing up the command `node minimal.js`

## Quickstart

Create a file named `run.js` with the following contents

```js
const se_scraper = require('se-scraper');

(async () => {
    let browser_config = {
        debug_level: 1,
        output_file: 'examples/results/data.json',
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['news', 'se-scraper'],
        num_pages: 1,
        // add some cool google search settings
        google_settings: {
            gl: 'us', // The gl parameter determines the Google country to use for the query.
            hl: 'en', // The hl parameter determines the Google UI language to return results.
            start: 0, // Determines the results offset to use, defaults to 0.
            num: 100, // Determines the number of results to show, defaults to 10. Maximum is 100.
        },
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_job);

    console.dir(results, {depth: null, colors: true});

    await scraper.quit();
})();
```

Start scraping by firing up the command `node run.js`

## Contribute

I really help and love your help! However scraping is a dirty business and it often takes me a lot of time to find failing selectors or missing JS logic. So if any search engine does not yield the results of your liking, please create a **static test case** similar to [this static test of google](test/static_tests/google.js) that fails. I will try to correct se-scraper then.

That's how you would proceed:

1. Copy the [static google test case](test/static_tests/google.js)
2. Remove all unnecessary testing code
3. Save a search to file where se-scraper does not work correctly.
3. Implement the static test case using the saved search html where se-scraper currently fails.
4. Submit a new issue with the failing test case as pull request
5. I will fix it! (or better: you submit a pull request directly)

## Proxies

**se-scraper** will create one browser instance per proxy. So the maximal amount of concurrency is equivalent to the number of proxies plus one (your own IP).

```js
const se_scraper = require('se-scraper');

(async () => {
    let browser_config = {
        debug_level: 1,
        output_file: 'examples/results/proxyresults.json',
        proxy_file: '/home/nikolai/.proxies', // one proxy per line
        log_ip_address: true,
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['news', 'scrapeulous.com', 'incolumitas.com', 'i work too much', 'what to do?', 'javascript is hard'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);
    await scraper.start();

    var results = await scraper.scrape(scrape_job);
    console.dir(results, {depth: null, colors: true});
    await scraper.quit();
})();
```

With a proxy file such as

```text
socks5://53.34.23.55:55523
socks4://51.11.23.22:22222
```

This will scrape with **three** browser instance each having their own IP address. Unfortunately, it is currently not possible to scrape with different proxies per tab. Chromium does not support that.


## Custom Scrapers

You can define your own scraper class and use it within se-scraper.

[Check this example out](examples/custom_scraper.js) that defines a custom scraper for Ecosia.


## Examples

* [Reuse existing browser](examples/multiple_search_engines.js) yields [these results](examples/results/multiple_search_engines.json)
* [Simple example scraping google](examples/quickstart.js) yields [these results](examples/results/data.json)
* [Scrape with one proxy per browser](examples/proxies.js) yields [these results](examples/results/proxyresults.json)
* [Scrape 100 keywords on Bing with multible tabs in one browser](examples/multiple_tabs.js) produces [this](examples/results/bing.json)
* [Inject your own scraping logic](examples/pluggable.js)
* [For the Lulz: Scraping google dorks for SQL injection vulnerabilites and confirming them.](examples/for_the_lulz.js)
* [Scrape google maps/locations](examples/google_maps.js) yields [these results](examples/results/maps.json)


## Scraping Model

**se-scraper** scrapes search engines only. In order to introduce concurrency into this library, it is necessary to define the scraping model. Then we can decide how we divide and conquer.

#### Scraping Resources

What are common scraping resources?

1. **Memory and CPU**. Necessary to launch multiple browser instances.
2. **Network Bandwith**. Is not often the bottleneck.
3. **IP Addresses**. Websites often block IP addresses after a certain amount of requests from the same IP address. Can be circumvented by using proxies.
4. Spoofable identifiers such as browser fingerprint or user agents. Those will be handled by **se-scraper**

#### Concurrency Model

**se-scraper** should be able to run without any concurrency at all. This is the default case. No concurrency means only one browser/tab is searching at the time.

For concurrent use, we will make use of a modified [puppeteer-cluster library](https://github.com/thomasdondorf/puppeteer-cluster).

One scrape job is properly defined by

* 1 search engine such as `google`
* `M` pages
* `N` keywords/queries
* `K` proxies and `K+1` browser instances (because when we have no proxies available, we will scrape with our dedicated IP)

Then **se-scraper** will create `K+1` dedicated browser instances with a unique ip address. Each browser will get `N/(K+1)` keywords and will issue `N/(K+1) * M` total requests to the search engine.

The problem is that [puppeteer-cluster library](https://github.com/thomasdondorf/puppeteer-cluster) does only allow identical options for subsequent new browser instances. Therefore, it is not trivial to launch a cluster of browsers with distinct proxy settings. Right now, every browser has the same options. It's not possible to set options on a per browser basis.

Solution:

1. Create a [upstream proxy router](https://github.com/GoogleChrome/puppeteer/issues/678).
2. Modify [puppeteer-cluster library](https://github.com/thomasdondorf/puppeteer-cluster) to accept a list of proxy strings and then pop() from this list at every new call to `workerInstance()` in https://github.com/thomasdondorf/puppeteer-cluster/blob/master/src/Cluster.ts I wrote an [issue here](https://github.com/thomasdondorf/puppeteer-cluster/issues/107). **I ended up doing this**.


## Technical Notes

Scraping is done with a headless chromium browser using the automation library puppeteer. Puppeteer is a Node library which provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol.

If you need to deploy scraping to the cloud (AWS or Azure), you can contact me at **hire@incolumitas.com**

The chromium browser is started with the following flags to prevent
scraping detection.

```js
var ADDITIONAL_CHROME_FLAGS = [
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920x1080',
    '--hide-scrollbars',
    '--disable-notifications',
];
```

Furthermore, to avoid loading unnecessary ressources and to speed up
scraping a great deal, we instruct chrome to not load images and css and media:

```js
await page.setRequestInterception(true);
page.on('request', (req) => {
    let type = req.resourceType();
    const block = ['stylesheet', 'font', 'image', 'media'];
    if (block.includes(type)) {
        req.abort();
    } else {
        req.continue();
    }
});
```

#### Making puppeteer and headless chrome undetectable

Consider the following resources:

* https://antoinevastel.com/bot%20detection/2019/07/19/detecting-chrome-headless-v3.html
* https://intoli.com/blog/making-chrome-headless-undetectable/
* https://intoli.com/blog/not-possible-to-block-chrome-headless/
* https://news.ycombinator.com/item?id=16179602

**se-scraper** implements the countermeasures against headless chrome detection proposed on those sites.

Most recent detection counter measures can be found here:

* https://github.com/paulirish/headless-cat-n-mouse/blob/master/apply-evasions.js

**se-scraper** makes use of those anti detection techniques.

To check whether evasion works, you can test it by passing `test_evasion` flag to the config:

```js
let config = {
    // check if headless chrome escapes common detection techniques
    test_evasion: true
};
```

It will create a screenshot named `headless-test-result.png` in the directory where the scraper was started that shows whether all test have passed.

## Advanced Usage

Use **se-scraper** by calling it with a script such as the one below.

```js
const se_scraper = require('se-scraper');

// those options need to be provided on startup
// and cannot give to se-scraper on scrape() calls
let browser_config = {
    // the user agent to scrape with
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3835.0 Safari/537.36',
    // if random_user_agent is set to True, a random user agent is chosen
    random_user_agent: false,
    // whether to select manual settings in visible mode
    set_manual_settings: false,
    // log ip address data
    log_ip_address: false,
    // log http headers
    log_http_headers: false,
    // how long to sleep between requests. a random sleep interval within the range [a,b]
    // is drawn before every request. empty string for no sleeping.
    sleep_range: '',
    // which search engine to scrape
    search_engine: 'google',
    compress: false, // compress
    // whether debug information should be printed
    // level 0: print nothing
    // level 1: print most important info
    // ...
    // level 4: print all shit nobody wants to know
    debug_level: 1,
    keywords: ['nodejs rocks',],
    // whether to start the browser in headless mode
    headless: true,
    // specify flags passed to chrome here
    chrome_flags: [],
    // the number of pages to scrape for each keyword
    num_pages: 1,
    // path to output file, data will be stored in JSON
    output_file: '',
    // whether to also passthru all the html output of the serp pages
    html_output: false,
    // whether to return a screenshot of serp pages as b64 data
    screen_output: false,
    // whether to prevent images, css, fonts and media from being loaded
    // will speed up scraping a great deal
    block_assets: true,
    // path to js module that extends functionality
    // this module should export the functions:
    // get_browser, handle_metadata, close_browser
    //custom_func: resolve('examples/pluggable.js'),
    custom_func: '',
    throw_on_detection: false,
    // use a proxy for all connections
    // example: 'socks5://78.94.172.42:1080'
    // example: 'http://118.174.233.10:48400'
    proxy: '',
    // a file with one proxy per line. Example:
    // socks5://78.94.172.42:1080
    // http://118.174.233.10:48400
    proxy_file: '',
    // whether to use proxies only
    // when this is set to true, se-scraper will not use
    // your default IP address
    use_proxies_only: false,
    // check if headless chrome escapes common detection techniques
    // this is a quick test and should be used for debugging
    test_evasion: false,
    apply_evasion_techniques: true,
    // settings for puppeteer-cluster
    puppeteer_cluster_config: {
        timeout: 30 * 60 * 1000, // max timeout set to 30 minutes
        monitor: false,
        concurrency: Cluster.CONCURRENCY_BROWSER,
        maxConcurrency: 1,
    }
};

(async () => {
    // scrape config can change on each scrape() call
    let scrape_config = {
        // which search engine to scrape
        search_engine: 'google',
        // an array of keywords to scrape
        keywords: ['cat', 'mouse'],
        // the number of pages to scrape for each keyword
        num_pages: 2,

        // OPTIONAL PARAMS BELOW:
        google_settings: {
            gl: 'us', // The gl parameter determines the Google country to use for the query.
            hl: 'fr', // The hl parameter determines the Google UI language to return results.
            start: 0, // Determines the results offset to use, defaults to 0.
            num: 100, // Determines the number of results to show, defaults to 10. Maximum is 100.
        },
        // instead of keywords you can specify a keyword_file. this overwrites the keywords array
        keyword_file: '',
        // how long to sleep between requests. a random sleep interval within the range [a,b]
        // is drawn before every request. empty string for no sleeping.
        sleep_range: '',
        // path to output file, data will be stored in JSON
        output_file: 'output.json',
        // whether to prevent images, css, fonts from being loaded
        // will speed up scraping a great deal
        block_assets: false,
        // check if headless chrome escapes common detection techniques
        // this is a quick test and should be used for debugging
        test_evasion: false,
        apply_evasion_techniques: true,
        // log ip address data
        log_ip_address: false,
        // log http headers
        log_http_headers: false,
    };

    let results = await se_scraper.scrape(browser_config, scrape_config);
    console.dir(results, {depth: null, colors: true});
})();
```

[Output for the above script on my machine.](examples/results/advanced.json)

### Query String Parameters

You can add your custom query string parameters to the configuration object by specifying a `google_settings` key. In general: `{{search engine}}_settings`.

For example you can customize your google search with the following config:

```js
let scrape_config = {
    search_engine: 'google',
    // use specific search engine parameters for various search engines
    google_settings: {
        google_domain: 'google.com',
        gl: 'us', // The gl parameter determines the Google country to use for the query.
        hl: 'us', // The hl parameter determines the Google UI language to return results.
        start: 0, // Determines the results offset to use, defaults to 0.
        num: 100, // Determines the number of results to show, defaults to 10. Maximum is 100.
    },
}
```
