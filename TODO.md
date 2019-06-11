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

### TODO:
    - fix duckduckgo test case!!!
    - add test case for infospace
    - add test case for google parameters for 
        - num
        - start
        - some language settings
    - write test case for proxy support and cluster support
    - add captcha service solving support
    - check if news instances run the same browser and if we can have one proxy per tab wokers
    - write test case for:
        - pluggable
