# Search Engine Scraper

This node module supports scraping several search engines.

Right now it's possible to scrape the following search engines

* Google
* Google News
* Google News App version (https://news.google.com)
* Google Image
* Bing
* Baidu
* Youtube
* Infospace
* Duckduckgo
* Webcrawler
* Reuters
* cnbc
* Marketwatch

This module uses puppeteer and puppeteer-cluster (modified version). It was created by the Developer of https://github.com/NikolaiT/GoogleScraper, a module with 1800 Stars on Github.

### Quickstart

**Note**: If you **don't** want puppeteer to download a complete chromium browser, add this variable to your environments. Then this library is not guaranteed to run out of the box.

```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
```

Then install with

```bash
npm install se-scraper
```

then create a file `run.js` with the following contents

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

#### Scrape with proxies

**se-scraper** will create one browser instance per proxy. So the maximal ammount of concurency is equivalent to the number of proxies plus one (your own IP).

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

With a proxy file such as (invalid proxies of course)

```text
socks5://53.34.23.55:55523
socks4://51.11.23.22:22222
```

This will scrape with **three** browser instance each having their own IP address. Unfortunately, it is currently not possible to scrape with different proxies per tab (chromium issue).

### Scraping Model

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


### Technical Notes

Scraping is done with a headless chromium browser using the automation library puppeteer. Puppeteer is a Node library which provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol.
 
 No multithreading is supported for now. Only one scraping worker per `scrape()` call.
 
 We will soon support parallelization. **se-scraper** will support an architecture similar to:
 
 1. https://antoinevastel.com/crawler/2018/09/20/parallel-crawler-puppeteer.html
 2. https://docs.browserless.io/blog/2018/06/04/puppeteer-best-practices.html

If you need to deploy scraping to the cloud (AWS or Azure), you can contact me at hire@incolumitas.com

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
scraping a great deal, we instruct chrome to not load images and css:

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

### Making puppeteer and headless chrome undetectable

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

### Advanced Usage

Use se-scraper by calling it with a script such as the one below.

```js
const se_scraper = require('se-scraper');
const resolve = require('path').resolve;

// options for scraping
event = {
    // the user agent to scrape with
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
    // if random_user_agent is set to True, a random user agent is chosen
    random_user_agent: true,
    // whether to select manual settings in visible mode
    set_manual_settings: false,
    // log ip address data
    log_ip_address: false,
    // log http headers
    log_http_headers: false,
    // how long to sleep between requests. a random sleep interval within the range [a,b]
    // is drawn before every request. empty string for no sleeping.
    sleep_range: '[1,1]',
    // which search engine to scrape
    search_engine: 'google',
    compress: false, // compress
    debug: false,
    verbose: true,
    keywords: ['scrapeulous.com'],
    // whether to start the browser in headless mode
    headless: true,
    // the number of pages to scrape for each keyword
    num_pages: 1,
    // path to output file, data will be stored in JSON
    output_file: '',
    // whether to prevent images, css, fonts and media from being loaded
    // will speed up scraping a great deal
    block_assets: true,
    // path to js module that extends functionality
    // this module should export the functions:
    // get_browser, handle_metadata, close_browser
    //custom_func: resolve('examples/pluggable.js'),
    custom_func: '',
    // path to a proxy file, one proxy per line. Example:
    // socks5://78.94.172.42:1080
    // http://118.174.233.10:48400
    proxy_file: '',
    proxies: [],
    // check if headless chrome escapes common detection techniques
    // this is a quick test and should be used for debugging
    test_evasion: false,
    // settings for puppeteer-cluster
    monitor: false,
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

Supported options for the `search_engine` config key:

```javascript
'google'
'google_news_old'
'google_news'
'google_image'
'bing'
'bing_news'
'infospace'
'webcrawler'
'baidu'
'youtube'
'duckduckgo_news'
'reuters'
'cnbc'
'marketwatch'
```

Output for the above script on my machine:

```text
{ 'scraping scrapeulous.com':
   { '1':
      { time: 'Tue, 29 Jan 2019 21:39:22 GMT',
        num_results: 'Ungefähr 145 Ergebnisse (0,18 Sekunden) ',
        no_results: false,
        effective_query: '',
        results:
         [ { link: 'https://scrapeulous.com/',
             title:
              'Scrapeuloushttps://scrapeulous.com/Im CacheDiese Seite übersetzen',
             snippet:
              'Scrapeulous.com allows you to scrape various search engines automatically ... or to find hidden links, Scrapeulous.com enables you to scrape a ever increasing ...',
             visible_link: 'https://scrapeulous.com/',
             date: '',
             rank: 1 },
           { link: 'https://scrapeulous.com/about/',
             title:
              'About - Scrapeuloushttps://scrapeulous.com/about/Im CacheDiese Seite übersetzen',
             snippet:
              'Scrapeulous.com allows you to scrape various search engines automatically and in large quantities. The business requirement to scrape information from ...',
             visible_link: 'https://scrapeulous.com/about/',
             date: '',
             rank: 2 },
           { link: 'https://scrapeulous.com/howto/',
             title:
              'Howto - Scrapeuloushttps://scrapeulous.com/howto/Im CacheDiese Seite übersetzen',
             snippet:
              'We offer scraping large amounts of keywords for the Google Search Engine. Large means any number of keywords between 40 and 50000. Additionally, we ...',
             visible_link: 'https://scrapeulous.com/howto/',
             date: '',
             rank: 3 },
           { link: 'https://github.com/NikolaiT/se-scraper',
             title:
              'GitHub - NikolaiT/se-scraper: Javascript scraping module based on ...https://github.com/NikolaiT/se-scraperIm CacheDiese Seite übersetzen',
             snippet:
              '24.12.2018 - Javascript scraping module based on puppeteer for many different search ... for many different search engines... https://scrapeulous.com/.',
             visible_link: 'https://github.com/NikolaiT/se-scraper',
             date: '24.12.2018 - ',
             rank: 4 },
           { link:
              'https://github.com/NikolaiT/GoogleScraper/blob/master/README.md',
             title:
              'GoogleScraper/README.md at master · NikolaiT/GoogleScraper ...https://github.com/NikolaiT/GoogleScraper/blob/.../README.mdIm CacheÄhnliche SeitenDiese Seite übersetzen',
             snippet:
              'GoogleScraper - Scraping search engines professionally. Scrapeulous.com - Scraping Service. GoogleScraper is a open source tool and will remain a open ...',
             visible_link:
              'https://github.com/NikolaiT/GoogleScraper/blob/.../README.md',
             date: '',
             rank: 5 },
           { link: 'https://googlescraper.readthedocs.io/',
             title:
              'Welcome to GoogleScraper\'s documentation! — GoogleScraper ...https://googlescraper.readthedocs.io/Im CacheDiese Seite übersetzen',
             snippet:
              'Welcome to GoogleScraper\'s documentation!¶. Contents: GoogleScraper - Scraping search engines professionally · Scrapeulous.com - Scraping Service ...',
             visible_link: 'https://googlescraper.readthedocs.io/',
             date: '',
             rank: 6 },
           { link: 'https://incolumitas.com/pages/scrapeulous/',
             title:
              'Coding, Learning and Business Ideas – Scrapeulous.com - Incolumitashttps://incolumitas.com/pages/scrapeulous/Im CacheDiese Seite übersetzen',
             snippet:
              'A scraping service for scientists, marketing professionals, analysts or SEO folk. In autumn 2018, I created a scraping service called scrapeulous.com. There you ...',
             visible_link: 'https://incolumitas.com/pages/scrapeulous/',
             date: '',
             rank: 7 },
           { link: 'https://incolumitas.com/',
             title:
              'Coding, Learning and Business Ideashttps://incolumitas.com/Im CacheDiese Seite übersetzen',
             snippet:
              'Scraping Amazon Reviews using Headless Chrome Browser and Python3. Posted on Mi ... GoogleScraper Tutorial - How to scrape 1000 keywords with Google.',
             visible_link: 'https://incolumitas.com/',
             date: '',
             rank: 8 },
           { link: 'https://en.wikipedia.org/wiki/Search_engine_scraping',
             title:
              'Search engine scraping - Wikipediahttps://en.wikipedia.org/wiki/Search_engine_scrapingIm CacheDiese Seite übersetzen',
             snippet:
              'Search engine scraping is the process of harvesting URLs, descriptions, or other information from search engines such as Google, Bing or Yahoo. This is a ...',
             visible_link: 'https://en.wikipedia.org/wiki/Search_engine_scraping',
             date: '',
             rank: 9 },
           { link:
              'https://readthedocs.org/projects/googlescraper/downloads/pdf/latest/',
             title:
              'GoogleScraper Documentation - Read the Docshttps://readthedocs.org/projects/googlescraper/downloads/.../latest...Im CacheDiese Seite übersetzen',
             snippet:
              '23.12.2018 - Contents: 1 GoogleScraper - Scraping search engines professionally. 1. 1.1 ... For this reason, I created the web service scrapeulous.com.',
             visible_link:
              'https://readthedocs.org/projects/googlescraper/downloads/.../latest...',
             date: '23.12.2018 - ',
             rank: 10 } ] },
     '2':
      { time: 'Tue, 29 Jan 2019 21:39:24 GMT',
        num_results: 'Seite 2 von ungefähr 145 Ergebnissen (0,20 Sekunden) ',
        no_results: false,
        effective_query: '',
        results:
         [ { link: 'https://pypi.org/project/CountryGoogleScraper/',
             title:
              'CountryGoogleScraper · PyPIhttps://pypi.org/project/CountryGoogleScraper/Im CacheDiese Seite übersetzen',
             snippet:
              'A module to scrape and extract links, titles and descriptions from various search ... Look [here to get an idea how to use asynchronous mode](http://scrapeulous.',
             visible_link: 'https://pypi.org/project/CountryGoogleScraper/',
             date: '',
             rank: 1 },
           { link: 'https://www.youtube.com/watch?v=a6xn6rc9GbI',
             title:
              'scrapeulous intro - YouTubehttps://www.youtube.com/watch?v=a6xn6rc9GbIDiese Seite übersetzen',
             snippet:
              'scrapeulous intro. Scrapeulous Scrapeulous. Loading... Unsubscribe from ... on Dec 16, 2018. Introduction ...',
             visible_link: 'https://www.youtube.com/watch?v=a6xn6rc9GbI',
             date: '',
             rank: 3 },
           { link:
              'https://www.reddit.com/r/Python/comments/2tii3r/scraping_260_search_queries_in_bing_in_a_matter/',
             title:
              'Scraping 260 search queries in Bing in a matter of seconds using ...https://www.reddit.com/.../scraping_260_search_queries_in_bing...Im CacheDiese Seite übersetzen',
             snippet:
              '24.01.2015 - Scraping 260 search queries in Bing in a matter of seconds using asyncio and aiohttp. (scrapeulous.com). submitted 3 years ago by ...',
             visible_link:
              'https://www.reddit.com/.../scraping_260_search_queries_in_bing...',
             date: '24.01.2015 - ',
             rank: 4 },
           { link: 'https://twitter.com/incolumitas_?lang=de',
             title:
              'Nikolai Tschacher (@incolumitas_) | Twitterhttps://twitter.com/incolumitas_?lang=deIm CacheÄhnliche SeitenDiese Seite übersetzen',
             snippet:
              'Learn how to scrape millions of url from yandex and google or bing with: http://scrapeulous.com/googlescraper-market-analysis.html … 0 replies 0 retweets 0 ...',
             visible_link: 'https://twitter.com/incolumitas_?lang=de',
             date: '',
             rank: 5 },
           { link:
              'http://blog.shodan.io/hostility-in-the-python-package-index/',
             title:
              'Hostility in the Cheese Shop - Shodan Blogblog.shodan.io/hostility-in-the-python-package-index/Im CacheDiese Seite übersetzen',
             snippet:
              '22.02.2015 - https://zzz.scrapeulous.com/r? According to the author of the website, these hostile packages are used as honeypots. Honeypots are usually ...',
             visible_link: 'blog.shodan.io/hostility-in-the-python-package-index/',
             date: '22.02.2015 - ',
             rank: 6 },
           { link: 'https://libraries.io/github/NikolaiT/GoogleScraper',
             title:
              'NikolaiT/GoogleScraper - Libraries.iohttps://libraries.io/github/NikolaiT/GoogleScraperIm CacheDiese Seite übersetzen',
             snippet:
              'A Python module to scrape several search engines (like Google, Yandex, Bing, ... https://scrapeulous.com/ ... You can install GoogleScraper comfortably with pip:',
             visible_link: 'https://libraries.io/github/NikolaiT/GoogleScraper',
             date: '',
             rank: 7 },
           { link: 'https://pydigger.com/pypi/CountryGoogleScraper',
             title:
              'CountryGoogleScraper - PyDiggerhttps://pydigger.com/pypi/CountryGoogleScraperDiese Seite übersetzen',
             snippet:
              '19.10.2016 - Look [here to get an idea how to use asynchronous mode](http://scrapeulous.com/googlescraper-260-keywords-in-a-second.html). ### Table ...',
             visible_link: 'https://pydigger.com/pypi/CountryGoogleScraper',
             date: '19.10.2016 - ',
             rank: 8 },
           { link: 'https://hub.docker.com/r/cimenx/data-mining-penandtest/',
             title:
              'cimenx/data-mining-penandtest - Docker Hubhttps://hub.docker.com/r/cimenx/data-mining-penandtest/Im CacheDiese Seite übersetzen',
             snippet:
              'Container. OverviewTagsDockerfileBuilds · http://scrapeulous.com/googlescraper-260-keywords-in-a-second.html. Docker Pull Command. Owner. profile ...',
             visible_link: 'https://hub.docker.com/r/cimenx/data-mining-penandtest/',
             date: '',
             rank: 9 },
           { link: 'https://www.revolvy.com/page/Search-engine-scraping',
             title:
              'Search engine scraping | Revolvyhttps://www.revolvy.com/page/Search-engine-scrapingIm CacheDiese Seite übersetzen',
             snippet:
              'Search engine scraping is the process of harvesting URLs, descriptions, or other information from search engines such as Google, Bing or Yahoo. This is a ...',
             visible_link: 'https://www.revolvy.com/page/Search-engine-scraping',
             date: '',
             rank: 10 } ] } } }
```