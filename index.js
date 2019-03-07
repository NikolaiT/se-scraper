const { Cluster } = require('./src/puppeteer-cluster/dist/index.js');
const handler = require('./src/node_scraper.js');
var fs = require('fs');
var os = require("os");

exports.scrape = async function(user_config, callback) {

    // options for scraping
    let config = {
        // the user agent to scrape with
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
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
        debug: false,
        verbose: true,
        keywords: ['search engine scraping scrapeulous.com'],
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
        apply_evasion_techniques: true,
        // settings for puppeteer-cluster
        puppeteer_cluster_config: {
            timeout: 30 * 60 * 1000, // max timeout set to 30 minutes
            monitor: false,
            concurrency: Cluster.CONCURRENCY_BROWSER,
            maxConcurrency: 1,
        }
    };

    // overwrite default config
    for (var key in user_config) {
        config[key] = user_config[key];
    }

    if (fs.existsSync(config.keyword_file)) {
        config.keywords = read_keywords_from_file(config.keyword_file);
    }

    if (fs.existsSync(config.proxy_file)) {
        config.proxies = read_keywords_from_file(config.proxy_file);
        if (config.verbose) {
            console.log(`${config.proxies.length} proxies loaded.`);
        }
    }

    if (!callback) {
        // called when results are ready
        callback = function (err, response) {
            if (err) {
                console.error(err)
            }

            console.dir(response.results, {depth: null, colors: true});
        }
    }

    await handler.handler(config, undefined, callback );
};

function read_keywords_from_file(fname) {
    let kws =  fs.readFileSync(fname).toString().split(os.EOL);
    // clean keywords
    kws = kws.filter((kw) => {
        return kw.trim().length > 0;
    });
    return kws;
}
