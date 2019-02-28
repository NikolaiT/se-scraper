# Search Engine Scraper - se-scraper

[![npm](https://badgen.now.sh/npm/v/se-scraper)](https://www.npmjs.com/package/se-scraper)
[![Known Vulnerabilities](https://snyk.io/test/github/NikolaiT/se-scraper/badge.svg)](https://snyk.io/test/github/NikolaiT/se-scraper)

This node module allows you to scrape search engines concurrently with different proxies.

If you don't have much technical experience or don't want to purchase proxies, you can use [my scraping service](https://scrapeulous.com/).

##### Table of Contents
- [Installation](#installation)
- [Quickstart](#quickstart)
- [Using Proxies](#proxies)
- [Examples](#examples)
- [Scraping Model](#scraping-model)
- [Technical Notes](#technical-notes)
- [Advanced Usage](#advanced-usage)


Se-scraper supports the following search engines:
* Google
* Google News
* Google News App version (https://news.google.com)
* Google Image
* Bing
* Bing News
* Baidu
* Youtube
* Infospace
* Duckduckgo
* Webcrawler
* Reuters
* Cnbc
* Marketwatch

This module uses puppeteer and a modified version of [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster/). It was created by the Developer of [GoogleScraper](https://github.com/NikolaiT/GoogleScraper), a module with 1800 Stars on Github.

## Installation

You need a working installation of **node** and the **npm** package manager.

Install **se-scraper** by entering the following command in your terminal

```bash
npm install se-scraper
```

If you **don't** want puppeteer to download a complete chromium browser, add this variable to your environment. Then this library is not guaranteed to run out of the box.

```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
```

## Quickstart

Create a file named `run.js` with the following contents

```js
const se_scraper = require('se-scraper');

let config = {
    search_engine: 'google',
    debug: false,
    verbose: false,
    keywords: ['news', 'scraping scrapeulous.com'],
    num_pages: 3,
    output_file: 'data.json',
};

function callback(err, response) {
    if (err) { console.error(err) }
    console.dir(response, {depth: null, colors: true});
}

se_scraper.scrape(config, callback);
```

Start scraping by firing up the command `node run.js`

## Proxies

**se-scraper** will create one browser instance per proxy. So the maximal amount of concurrency is equivalent to the number of proxies plus one (your own IP).

```js
const se_scraper = require('se-scraper');

let config = {
    search_engine: 'google',
    debug: false,
    verbose: false,
    keywords: ['news', 'scrapeulous.com', 'incolumitas.com', 'i work too much'],
    num_pages: 1,
    output_file: 'data.json',
    proxy_file: '/home/nikolai/.proxies', // one proxy per line
    log_ip_address: true,
};

function callback(err, response) {
    if (err) { console.error(err) }
    console.dir(response, {depth: null, colors: true});
}

se_scraper.scrape(config, callback);
```

With a proxy file such as

```text
socks5://53.34.23.55:55523
socks4://51.11.23.22:22222
```

This will scrape with **three** browser instance each having their own IP address. Unfortunately, it is currently not possible to scrape with different proxies per tab. Chromium does not support that.

## Examples

* [Simple example scraping google](examples/quickstart.js) yields [these results](examples/results/data.json)
* [Scrape with one proxy per browser](examples/proxies.js) yields [these results](examples/results/proxyresults.json)
* [Scrape 100 keywords on Bing with multible tabs in one browser](examples/multiple_tabs.js) produces [this](examples/results/bing.json)
* [Inject your own scraping logic](examples/pluggable.js)


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

let config = {
    // the user agent to scrape with
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
    // if random_user_agent is set to True, a random user agent is chosen
    random_user_agent: true,
    // how long to sleep between requests. a random sleep interval within the range [a,b]
    // is drawn before every request. empty string for no sleeping.
    sleep_range: '[1,2]',
    // which search engine to scrape
    search_engine: 'google',
    // whether debug information should be printed
    // debug info is useful for developers when debugging
    debug: false,
    // whether verbose program output should be printed
    // this output is informational
    verbose: true,
    // an array of keywords to scrape
    keywords: ['scrapeulous.com', 'scraping search engines', 'scraping service scrapeulous', 'learn js'],
    // alternatively you can specify a keyword_file. this overwrites the keywords array
    keyword_file: '',
    // the number of pages to scrape for each keyword
    num_pages: 2,
    // whether to start the browser in headless mode
    headless: true,
    // path to output file, data will be stored in JSON
    output_file: 'examples/results/advanced.json',
    // whether to prevent images, css, fonts from being loaded
    // will speed up scraping a great deal
    block_assets: true,
    // path to js module that extends functionality
    // this module should export the functions:
    // get_browser, handle_metadata, close_browser
    // must be an absolute path to the module
    //custom_func: resolve('examples/pluggable.js'),
    custom_func: '',
    // use a proxy for all connections
    // example: 'socks5://78.94.172.42:1080'
    // example: 'http://118.174.233.10:48400'
    proxy: '',
    // a file with one proxy per line. Example:
    // socks5://78.94.172.42:1080
    // http://118.174.233.10:48400
    proxy_file: '',
    // check if headless chrome escapes common detection techniques
    // this is a quick test and should be used for debugging
    test_evasion: false,
    // log ip address data
    log_ip_address: false,
    // log http headers
    log_http_headers: false,
    puppeteer_cluster_config: {
        timeout: 10 * 60 * 1000, // max timeout set to 10 minutes
        monitor: false,
        concurrency: 1, // one scraper per tab
        maxConcurrency: 2, // scrape with 2 tabs
    }
};

function callback(err, response) {
    if (err) { console.error(err) }

    /* response object has the following properties:

        response.results - json object with the scraping results
        response.metadata - json object with metadata information
        response.statusCode - status code of the scraping process
     */

    console.dir(response.results, {depth: null, colors: true});
}

se_scraper.scrape(config, callback);
```

[Output for the above script on my machine.](examples/results/advanced.json)