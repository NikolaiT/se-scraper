var fs = require('fs');
var path = require('path');
var os = require("os");

const se_scraper = require('./../index.js');
var filepath_de = path.join(__dirname, '/data/keywords_de.txt');

function read_keywords_from_file(fpath) {
    let kws =  fs.readFileSync(fpath).toString().split(os.EOL);
    // clean keywords
    kws = kws.filter((kw) => {
        return kw.trim().length > 0;
    });
    return kws;
}

let keywords_de = read_keywords_from_file(filepath_de);

const Cluster = {
    CONCURRENCY_PAGE: 1, // shares cookies, etc.
    CONCURRENCY_CONTEXT: 2, // no cookie sharing (uses contexts)
    CONCURRENCY_BROWSER: 3, // no cookie sharing and individual processes (uses contexts)
};

// those options need to be provided on startup
// and cannot give to se-scraper on scrape() calls
let browser_config = {
    // the user agent to scrape with
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
    // if random_user_agent is set to True, a random user agent is chosen
    random_user_agent: true,
    verbose: true,
    // whether to start the browser in headless mode
    headless: true,
    is_local: false,
    throw_on_detection: false,
    puppeteer_cluster_config: {
        headless: true,
        timeout: 2 * 60 * 1000, // max timeout set to 2 minutes
        monitor: false,
        concurrency: 3, // one scraper per tab
        maxConcurrency: 3, // scrape with 5 tabs
    }
};

(async () => {
    // scrape config can change on each scrape() call
    let scrape_config_bing_de = {
        // which search engine to scrape
        search_engine: 'bing',
        // an array of keywords to scrape
        keywords: keywords_de,
        // the number of pages to scrape for each keyword
        num_pages: 10,

        // OPTIONAL PARAMS BELOW:
        // https://docs.microsoft.com/en-us/rest/api/cognitiveservices-bingsearch/bing-web-api-v5-reference#query-parameters
        bing_settings: {
            cc: 'DE', // The cc parameter determines the country to use for the query.
            mkt: 'de-DE', // The mkt parameter determines the UI language to return results.
            offset: 0, // Determines the results offset to use, defaults to 0.
            count: 20, // Determines the number of results to show, defaults to 10. Maximum is 100.
        },
        // how long to sleep between requests. a random sleep interval within the range [a,b]
        // is drawn before every request. empty string for no sleeping.
        sleep_range: '',
        // path to output file, data will be stored in JSON
        output_file: 'examples/bing_de.json',
        // whether to prevent images, css, fonts from being loaded
        // will speed up scraping a great deal
        block_assets: true,
        // check if headless chrome escapes common detection techniques
        // this is a quick test and should be used for debugging
        test_evasion: false,
        apply_evasion_techniques: true,
        // log ip address data
        log_ip_address: false,
        // log http headers
        log_http_headers: false,
    };

    let results = await se_scraper.scrape(browser_config, scrape_config_bing_de);
    console.dir(results.metadata, {depth: null, colors: true});

})();