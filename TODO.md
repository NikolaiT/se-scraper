### 24.12.2018
    - fix interface to scrape() [DONE]
    - add to Github


### 24.1.2018
    - fix issue #3: add functionality to add keyword file

### 27.1.2019
    - Add functionality to block images and CSS from loading as described here:
        https://www.scrapehero.com/how-to-increase-web-scraping-speed-using-puppeteer/
        https://www.scrapehero.com/how-to-build-a-web-scraper-using-puppeteer-and-node-js/

### 29.1.2019
    - implement proxy support functionality
        - implement proxy check

    - implement scraping more than 1 page
        - do it for google
        - and bing
    - implement duckduckgo scraping


### 30.1.2019
    - modify all scrapers to use the generic class where it makes sense
        - Bing, Baidu, Google, Duckduckgo

### 7.2.2019
    - add num_requests to test cases [done]

### 25.2.2019
    - https://antoinevastel.com/crawler/2018/09/20/parallel-crawler-puppeteer.html
    - add support for browsing with multiple browsers, use this neat library:
    - https://github.com/thomasdondorf/puppeteer-cluster [done]
    
    
### 28.2.2019
    - write test case for multiple browsers/proxies
    - write test case and example for multiple tabs with bing
    - make README.md nicer. https://github.com/thomasdondorf/puppeteer-cluster/blob/master/README.md as template


### 11.6.2019
    - TODO: fix amazon scraping
    - change api of remaining test cases [done]
    - TODO: implement custom search engine parameters on scrape()
    
### 12.6.2019
    - remove unnecessary sleep() calls and replace with waitFor selectors


### 16.7.2019

- resolve issues
    - fix this https://github.com/NikolaiT/se-scraper/issues/37 [done]
    
- use puppeteer stealth plugin: https://www.npmjs.com/package/puppeteer-extra-plugin-stealth

    - we will need to load at the concurrency impl of puppeteer-cluster [no typescript support :(), I will not support this right now]

- user random user agents plugin: https://github.com/intoli/user-agents [done]

- add screenshot capability (make the screen after parsing)
    - store as b64 [done]



### 12.8.2019

- add static test case for bing [done]
- add options that minimize `html_output` flag: 
    `clean_html_output` will remove all JS and CSS from the html 
    `clean_data_images` removes all data images from the html
    [done]
    
    
### 13.8.2019
- Write test case for clean html output [done]
- Consider better compression algorithm. [done] There is the brotli algorithm, but this is only supported
  in very recent versions of nodejs
- what else can we remove from the dom [done] Removing comment nodes now! They are large in BING.
- remove all whitespace and \n and \t from html

### TODO:
1. fix googlenewsscraper waiting for results and parsing. remove the static sleep [done]
2. when using multiple browsers and random user agent, pass a random user agent to each perBrowserOptions

3. dont create a new tab when opening a new scraper
