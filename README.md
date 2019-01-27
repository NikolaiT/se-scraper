# Search Engine Scraper

This node module supports scraping several search engines.

Right now scraping for 

* Google
* Google News
* Google News New (https://news.google.com)
* Google Image
* Bing
* Baidu
* Youtube
* Infospace
* Duckduckgo
* Webcrawler

is supported.

This module uses puppeteer. It was created by the Developer of https://github.com/NikolaiT/GoogleScraper, a module with 1800 Stars on Github.

### Technical Notes

Scraping is done with a headless chromium browser using the automation library puppeteer. Puppeteer is a Node library which provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol.
 
 No multithreading is supported for now. Only one scraping worker per `scrape()` call. 

If you need to deploy scraping to the cloud (AWS or Azure), you can contact me on hire@incolumitas.com


### Installation and Usage

Install with 

```bash
npm install se-scraper
```

Use se-scraper by calling it with a script such as the one below.

```javascript
const se_scraper = require('se-scraper');

let config = {
    // the user agent to scrape with
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
    // if random_user_agent is set to True, a random user agent is chosen
    random_user_agent: false,
    // get meta data of scraping in return object
    write_meta_data: true,
    // how long to sleep between requests. a random sleep interval within the range [a,b]
    // is drawn before every request. empty string for no sleeping.
    sleep_range: '[1,1]',
    // which search engine to scrape
    search_engine: 'yahoo_news',
    // whether debug information should be printed
    debug: true,
    // whether verbose program output should be printed
    verbose: false,
    // an array of keywords to scrape
    keywords: ['GOOGL', ],
    // alternatively you can specify a keyword_file. this overwrites the keywords array
    keyword_file: './keywords.txt',
    // whether to start the browser in headless mode
    headless: false,
    // path to output file, data will be stored in JSON
    output_file: 'results.json',
    // whether to prevent images, css, fonts from being loaded
    // will speed up scraping a great deal
    block_assets: true
};

se_scraper.scrape(config, (err, response) => {
    if (err) { console.error(err) }

    /* response object has the following properties:

        response.results - json object with the scraping results
        response.metadata - json object with metadata information
        response.statusCode - status code of the scraping process
     */

    console.dir(response.results, {depth: null, colors: true});
});
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
'google_dr'
'yahoo_news'
```

Output for the above script on my laptop:

```text
Scraper took 4295ms to scrape 2 keywords.
On average ms/keyword: 2147.5ms/keyword
{ 'incolumitas.com scraping':
   { time: 'Mon, 24 Dec 2018 13:07:43 GMT',
     num_results: 'Ungefähr 2’020 Ergebnisse (0.18 Sekunden) ',
     no_results: false,
     effective_query: '',
     results:
      [ { link:
           'https://incolumitas.com/2018/10/29/youtube-puppeteer-scraping/',
          title:
           'Coding, Learning and Business Ideas – Tutorial: Youtube scraping ...',
          snippet:
           '29.10.2018 - In this blog post I am going to show you how to scrape YouTube video data using the handy puppeteer library. Puppeteer is a Node library ...',
          visible_link:
           'https://incolumitas.com/2018/10/29/youtube-puppeteer-scraping/',
          date: '29.10.2018 - ',
          rank: 1 },
        { link: 'https://incolumitas.com/2018/09/05/googlescraper-tutorial/',
          title:
           'GoogleScraper Tutorial - How to scrape 1000 keywords with Google',
          snippet:
           '05.09.2018 - Tutorial that teaches how to use GoogleScraper to scrape 1000 keywords with 10 selenium browsers.',
          visible_link: 'https://incolumitas.com/2018/09/05/googlescraper-tutorial/',
          date: '05.09.2018 - ',
          rank: 2 },
        { link: 'https://incolumitas.com/tag/scraping.html',
          title: 'Coding, Learning and Business Ideas – Tag Scraping',
          snippet:
           'Scraping Amazon Reviews using Headless Chrome Browser and Python3. Posted on Mi ... GoogleScraper Tutorial - How to scrape 1000 keywords with Google.',
          visible_link: 'https://incolumitas.com/tag/scraping.html',
          date: '',
          rank: 3 },
        { link: 'https://incolumitas.com/category/scraping.html',
          title: 'Coding, Learning and Business Ideas – Category Scraping',
          snippet:
           'Nikolai Tschacher\'s ideas and projects around IT security and computer science.',
          visible_link: 'https://incolumitas.com/category/scraping.html',
          date: '',
          rank: 4 },
        { link:
           'https://github.com/NikolaiT/incolumitas/blob/master/content/Meta/scraping-and-extracting-links-from-any-major-search-engine-like-google-yandex-baidu-bing-and-duckduckgo.md',
          title:
           'incolumitas/scraping-and-extracting-links-from-any-major-search ...',
          snippet:
           'Title: Scraping and Extracting Links from any major Search Engine like Google, Yandex, Baidu, Bing and Duckduckgo Date: 2014-11-12 00:47 Author: Nikolai ...',
          visible_link:
           'https://github.com/.../incolumitas/.../scraping-and-extracting-links...',
          date: '',
          rank: 5 },
        { link:
           'https://stackoverflow.com/questions/16955325/scraping-google-results-with-python',
          title: 'Scraping Google Results with Python - Stack Overflow',
          snippet:
           'I found this. incolumitas.com/2013/01/06/… But the author claims it is not ported to 2.7 yet. – user2351394 Jun 6 \'13 at 6:59 ...',
          visible_link:
           'https://stackoverflow.com/.../scraping-google-results-with-python',
          date: '',
          rank: 6 },
        { link: 'https://pypi.org/project/GoogleScraper/0.1.18/',
          title: 'GoogleScraper · PyPI',
          snippet:
           '[5]: http://incolumitas.com/2014/11/12/scraping-and-extracting-links-from-any-major-search-engine-like-google-yandex-baidu-bing-and-duckduckgo/ ...',
          visible_link: 'https://pypi.org/project/GoogleScraper/0.1.18/',
          date: '',
          rank: 7 },
        { link:
           'https://www.reddit.com/r/Python/comments/2m0vyu/scraping_links_on_google_yandex_bing_duckduckgo/',
          title:
           'Scraping links on Google, Yandex, Bing, Duckduckgo, Baidu and ...',
          snippet:
           '12.11.2014 - Scraping links on Google, Yandex, Bing, Duckduckgo, Baidu and other search engines with Python ... submitted 4 years ago by incolumitas.',
          visible_link:
           'https://www.reddit.com/.../scraping_links_on_google_yandex_bi...',
          date: '12.11.2014 - ',
          rank: 9 },
        { link: 'https://twitter.com/incolumitas_?lang=de',
          title: 'Nikolai Tschacher (@incolumitas_) | Twitter',
          snippet:
           'Embed Tweet. How to use GoogleScraper to scrape images and download them ... Learn how to scrape millions of url from yandex and google or bing with: ...',
          visible_link: 'https://twitter.com/incolumitas_?lang=de',
          date: '',
          rank: 10 } ] },
  'best scraping framework':
   { time: 'Mon, 24 Dec 2018 13:07:44 GMT',
     num_results: 'Ungefähr 2’820’000 Ergebnisse (0.36 Sekunden) ',
     no_results: false,
     effective_query: '',
     results:
      [ { link:
           'http://www.aioptify.com/top-web-scraping-frameworks-and-librares.php',
          title: 'Top Web Scraping Frameworks and Libraries - AI Optify',
          snippet: '',
          visible_link:
           'www.aioptify.com/top-web-scraping-frameworks-and-librares.php',
          date: '',
          rank: 1 },
        { link:
           'http://www.aioptify.com/top-web-scraping-frameworks-and-librares.php',
          title: 'Top Web Scraping Frameworks and Libraries - AI Optify',
          snippet: '',
          visible_link:
           'www.aioptify.com/top-web-scraping-frameworks-and-librares.php',
          date: '',
          rank: 2 },
        { link:
           'https://www.scrapehero.com/open-source-web-scraping-frameworks-and-tools/',
          title:
           'Best Open Source Web Scraping Frameworks and Tools - ScrapeHero',
          snippet:
           '05.06.2018 - List of Open Source Web Scraping Frameworks. Scrapy. MechanicalSoup. PySpider. Portia. Apify SDK. Nodecrawler. Selenium WebDriver. Puppeteer.',
          visible_link:
           'https://www.scrapehero.com/open-source-web-scraping-framewo...',
          date: '05.06.2018 - ',
          rank: 3 },
        { link:
           'https://medium.com/datadriveninvestor/best-data-scraping-tools-for-2018-top-10-reviews-558cc5a4992f',
          title:
           'Best Data Scraping Tools for 2018 (Top 10 Reviews) – Data Driven ...',
          snippet:
           '05.03.2018 - Pros: Octoparse is the best free data scraping tool I\'ve met. ... your Scrapy (a open-source data extraction framework) web spider\'s activities.',
          visible_link:
           'https://medium.com/.../best-data-scraping-tools-for-2018-top-10-...',
          date: '05.03.2018 - ',
          rank: 4 },
        { link:
           'https://www.quora.com/What-is-the-best-web-scraping-open-source-tool',
          title: 'What is the best web scraping open source tool? - Quora',
          snippet:
           '15.06.2015 - My personal favourite is Python Scrapy and it is an excellent framework for building a web data scraper. Why Scrapy? 1) It is an open source framework and cost ...',
          visible_link:
           'https://www.quora.com/What-is-the-best-web-scraping-open-sour...',
          date: '15.06.2015 - ',
          rank: 5 },
        { link:
           'http://www.aioptify.com/top-web-scraping-frameworks-and-librares.php',
          title: 'Top Web Scraping Frameworks and Libraries - AI Optify',
          snippet:
           '21.05.2018 - Top Web Scraping Frameworks and Libraries. Requests. Scrapy. Beautiful Soup. Selenium with Python. lxml. Webscraping with Selenium - part 1. Extracting data from websites with Scrapy. Scrapinghub.',
          visible_link:
           'www.aioptify.com/top-web-scraping-frameworks-and-librares.php',
          date: '21.05.2018 - ',
          rank: 6 },
        { link: 'https://scrapy.org/',
          title:
           'Scrapy | A Fast and Powerful Scraping and Web Crawling Framework',
          snippet:
           'An open source and collaborative framework for extracting the data you need from ... Spider): name = \'blogspider\' start_urls = [\'https://blog.scrapinghub.com\'] def ...',
          visible_link: 'https://scrapy.org/',
          date: '',
          rank: 7 },
        { link:
           'https://www.scraperapi.com/blog/the-10-best-web-scraping-tools',
          title: 'The 10 Best Web Scraping Tools of 2018 - Scraper API',
          snippet:
           '19.07.2018 - The 10 Best Web Scraping Tools of 2018. ParseHub. Scrapy. Diffbot. Cheerio. Website: https://cheerio.js.org. Beautiful Soup. Website: https://www.crummy.com/software/BeautifulSoup/ Puppeteer. Website: https://github.com/GoogleChrome/puppeteer. Content Grabber. Website: http://www.contentgrabber.com/ Mozenda. Website: ...',
          visible_link:
           'https://www.scraperapi.com/blog/the-10-best-web-scraping-tools',
          date: '19.07.2018 - ',
          rank: 8 },
        { link: 'https://elitedatascience.com/python-web-scraping-libraries',
          title: '5 Tasty Python Web Scraping Libraries - EliteDataScience',
          snippet:
           '03.02.2017 - We\'ve decided to feature the 5 Python libraries for web scraping that ... The good news is that you can swap out its parser with a faster one if ... Scrapy is technically not even a library… it\'s a complete web scraping framework.',
          visible_link: 'https://elitedatascience.com/python-web-scraping-libraries',
          date: '03.02.2017 - ',
          rank: 9 },
        { link:
           'https://blog.michaelyin.info/web-scraping-framework-review-scrapy-vs-selenium/',
          title:
           'Web Scraping Framework Review: Scrapy VS Selenium | MichaelYin ...',
          snippet:
           '01.10.2018 - In this Scrapy tutorial, I will cover the features of Scrapy and Selenium, and help you decide which one is better for your projects.',
          visible_link:
           'https://blog.michaelyin.info/web-scraping-framework-review-scr...',
          date: '01.10.2018 - ',
          rank: 10 },
        { link: 'https://github.com/lorien/awesome-web-scraping',
          title:
           'GitHub - lorien/awesome-web-scraping: List of libraries, tools and APIs ...',
          snippet:
           'List of libraries, tools and APIs for web scraping and data processing. ... golang.md · add dataflow kit framework, 2 months ago ... Make this list better!',
          visible_link: 'https://github.com/lorien/awesome-web-scraping',
          date: '',
          rank: 11 },
        { link: 'https://www.import.io/post/best-web-scraping-tools-2018/',
          title: 'Best Web Scraping Software Tools 2018 | Import.io',
          snippet:
           '07.08.2018 - List of Best Web Scraping SoftwareThere are hundreds of Web ... it is a fast high-level screen scraping and web crawling framework, used to ...',
          visible_link: 'https://www.import.io/post/best-web-scraping-tools-2018/',
          date: '07.08.2018 - ',
          rank: 12 } ] } }
```