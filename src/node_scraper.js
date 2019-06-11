const zlib = require('zlib');
var fs = require('fs');
var os = require("os");
const google = require('./modules/google.js');
const amazon = require('./modules/amazon.js');
const bing = require('./modules/bing.js');
const baidu = require('./modules/baidu.js');
const infospace = require('./modules/infospace.js');
const youtube = require('./modules/youtube.js');
const ua = require('./modules/user_agents.js');
const duckduckgo = require('./modules/duckduckgo.js');
const tickersearch = require('./modules/ticker_search.js');
const { Cluster } = require('./puppeteer-cluster/dist/index.js');
const common = require('./modules/common.js');
var log = common.log;

function write_results(fname, data) {
    fs.writeFileSync(fname, data, (err) => {
        if (err) throw err;
        console.log(`Results written to file ${fname}`);
    });
}

function read_keywords_from_file(fname) {
    let kws =  fs.readFileSync(fname).toString().split(os.EOL);
    // clean keywords
    kws = kws.filter((kw) => {
        return kw.trim().length > 0;
    });
    return kws;
}

function getScraper(searchEngine, args) {
    return new {
        google: google.GoogleScraper,
        google_news_old: google.GoogleNewsOldScraper,
        google_news: google.GoogleNewsScraper,
        google_image: google.GoogleImageScraper,
        bing: bing.BingScraper,
        bing_news: bing.BingNewsScraper,
        amazon: amazon.AmazonScraper,
        duckduckgo: duckduckgo.DuckduckgoScraper,
        duckduckgo_news: duckduckgo.DuckduckgoNewsScraper,
        infospace: infospace.InfospaceScraper,
        webcrawler: infospace.WebcrawlerNewsScraper,
        baidu: baidu.BaiduScraper,
        youtube: youtube.YoutubeScraper,
        yahoo_news: tickersearch.YahooFinanceScraper,
        reuters: tickersearch.ReutersFinanceScraper,
        cnbc: tickersearch.CnbcFinanceScraper,
        marketwatch: tickersearch.MarketwatchFinanceScraper,
    }[searchEngine](args);
}


class ScrapeManager {

    constructor(config = {}) {

        this.config = {
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
        for (var key in config) {
            this.config[key] = config[key];
        }

        this.config = parseEventData(this.config);

        if (fs.existsSync(this.config.keyword_file)) {
            this.config.keywords = read_keywords_from_file(this.config.keyword_file);
        }

        if (fs.existsSync(this.config.proxy_file)) {
            this.config.proxies = read_keywords_from_file(this.config.proxy_file);
            log(this.config, 1, `${this.config.proxies.length} proxies read from file.`);
        }

        log(this.config, 2, this.config);

        this.cluster = null;
        this.pluggable = null;
        this.scraper = null;
    }

    /*
     * Launches the puppeteer cluster or browser.
     */
    async start() {

        if (this.config.custom_func) {
            if (fs.existsSync(this.config.custom_func)) {
                try {
                    const PluggableClass = require(this.config.custom_func);
                    this.pluggable = new PluggableClass({config: this.config});
                } catch (exception) {
                    console.error(exception);
                }
            } else {
                console.error(`File "${this.config.custom_func}" does not exist!`);
            }
        }

        // See here: https://peter.sh/experiments/chromium-command-line-switches/
        var chrome_flags = [
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

        if (Array.isArray(this.config.chrome_flags) && this.config.chrome_flags.length) {
            chrome_flags = this.config.chrome_flags;
        }

        var user_agent = null;

        if (this.config.user_agent) {
            user_agent = this.config.user_agent;
        }

        if (this.config.random_user_agent === true) {
            user_agent = ua.random_user_agent();
        }

        if (user_agent) {
            chrome_flags.push(
                `--user-agent=${user_agent}`
            )
        }

        if (this.config.proxy) {
            chrome_flags.push(
                '--proxy-server=' + this.config.proxy,
            )
        }

        let launch_args = {
            args: chrome_flags,
            headless: this.config.headless,
            ignoreHTTPSErrors: true,
        };

        log(this.config, 2, `Using the following puppeteer configuration: ${launch_args}`);

        if (this.pluggable) {
            launch_args.config = this.config;
            this.browser = await this.pluggable.start_browser(launch_args);
        } else {
            // if no custom start_browser functionality was given
            // use puppeteer-cluster for scraping
            const { Cluster } = require('./puppeteer-cluster/dist/index.js');

            this.numClusters = this.config.puppeteer_cluster_config.maxConcurrency;
            var perBrowserOptions = [];

            // if we have at least one proxy, always use CONCURRENCY_BROWSER
            // and set maxConcurrency to this.config.proxies.length + 1
            // else use whatever this.configuration was passed
            if (this.config.proxies.length > 0) {
                this.config.puppeteer_cluster_config.concurrency = Cluster.CONCURRENCY_BROWSER;
                // because we use real browsers, we ran out of memory on normal laptops
                // when using more than maybe 5 or 6 browsers.
                // therfore hardcode a limit here
                this.numClusters = Math.min(this.config.proxies.length + 1, 5);
                this.config.puppeteer_cluster_config.maxConcurrency = this.numClusters;

                // the first browser this.config with home IP
                perBrowserOptions = [launch_args, ];

                for (var proxy of this.config.proxies) {
                    perBrowserOptions.push({
                        headless: this.config.headless,
                        ignoreHTTPSErrors: true,
                        args: chrome_flags.concat(`--proxy-server=${proxy}`)
                    })
                }
            }

            this.cluster = await Cluster.launch({
                monitor: this.config.puppeteer_cluster_config.monitor,
                timeout: this.config.puppeteer_cluster_config.timeout, // max timeout set to 30 minutes
                concurrency: this.config.puppeteer_cluster_config.concurrency,
                maxConcurrency: this.config.puppeteer_cluster_config.maxConcurrency,
                puppeteerOptions: launch_args,
                perBrowserOptions: perBrowserOptions,
            });

            this.cluster.on('taskerror', (err, data) => {
                console.log(`Error while scraping ${data}: ${err.message}`);
                console.log(err)
            });

        }
    }

    /*
     * Scrapes the keywords specified by the config.
     */
    async scrape(scrape_config = {}) {
        this.config.keywords = scrape_config.keywords;
        this.config.num_pages = scrape_config.num_pages;
        this.config.search_engine = scrape_config.search_engine;

        var results = {};
        var num_requests = 0;
        var metadata = {};

        var startTime = Date.now();

        if (this.config.keywords && this.config.search_engine) {
            log(this.config, 1, `[se-scraper] started at [${(new Date()).toUTCString()}] and scrapes ${this.config.search_engine} with ${this.config.keywords.length} keywords on ${this.config.num_pages} pages each.`)
        }

        if (this.config.do_work && this.pluggable) {
            let res = await this.pluggable.do_work(page);
            results = res.results;
            num_requests = res.num_requests;
        } else {
            //     const page = await this.browser.newPage();
            //     this.scraper = getScraper(this.config.search_engine, {
            //         config: this.config,
            //         context: context,
            //         pluggable: pluggable,
            //         page: page,
            //     });
            //     results = await this.scraper.run({});
            //     num_requests = this.scraper.num_requests;
            //     metadata = this.scraper.metadata;
            // }

            // Each browser will get N/(K+1) keywords and will issue N/(K+1) * M total requests to the search engine.
            // https://github.com/GoogleChrome/puppeteer/issues/678
            // The question is: Is it possible to set proxies per Page? Per Browser?
            // as far as I can see, puppeteer cluster uses the same puppeteerOptions
            // for every browser instance. We will use our custom puppeteer-cluster version.
            // https://www.npmjs.com/package/proxy-chain
            // this answer looks nice: https://github.com/GoogleChrome/puppeteer/issues/678#issuecomment-389096077
            let chunks = [];
            for (var n = 0; n < this.numClusters; n++) {
                chunks.push([]);
            }
            for (var k = 0; k < this.config.keywords.length; k++) {
                chunks[k % this.numClusters].push(this.config.keywords[k]);
            }

            let execPromises = [];
            let scraperInstances = [];
            for (var c = 0; c < chunks.length; c++) {
                this.config.keywords = chunks[c];
                // the first scraping this.config uses the home IP
                if (c > 0) {
                    this.config.proxy = this.config.proxies[c - 1];
                }
                var obj = getScraper(this.config.search_engine, {
                    config: this.config,
                    context: {},
                    pluggable: this.pluggable,
                });

                var boundMethod = obj.run.bind(obj);
                execPromises.push(this.cluster.execute({}, boundMethod));
                scraperInstances.push(obj);
            }

            let resolved = await Promise.all(execPromises);

            for (var group of resolved) {
                for (var key in group) {
                    results[key] = group[key];
                }
            }

            // count total requests among all scraper instances
            for (var o of scraperInstances) {
                num_requests += o.num_requests;
            }
        }

        let timeDelta = Date.now() - startTime;
        let ms_per_request = timeDelta/num_requests;

        log(this.config, 1, `Scraper took ${timeDelta}ms to perform ${num_requests} requests.`);
        log(this.config, 1, `On average ms/request: ${ms_per_request}ms/request`);

        if (this.config.compress === true) {
            results = JSON.stringify(results);
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
            results = zlib.deflateSync(results).toString('base64');
        }

        if (this.pluggable && this.pluggable.handle_results) {
            await this.pluggable.handle_results({
                config: this.config,
                results: results,
            });
        }

        if (this.config.chunk_lines) {
            metadata.chunk_lines = this.config.chunk_lines;
            if (this.config.job_name) {
                metadata.id = `${this.config.job_name} ${this.config.chunk_lines}`;
            }
        }

        metadata.elapsed_time = timeDelta.toString();
        metadata.ms_per_keyword = ms_per_request.toString();
        metadata.num_requests = num_requests;

        log(this.config, 2, metadata);

        if (this.pluggable && this.pluggable.handle_metadata) {
            await this.pluggable.handle_metadata({metadata: metadata, config: this.config});
        }

        if (this.config.output_file) {
            write_results(this.config.output_file, JSON.stringify(results, null, 4));
        }

        return {
            headers: {
                'Content-Type': 'text/json',
            },
            results: results,
            metadata: metadata || {},
            statusCode: 200
        };

    }

    /*
     * Quits the puppeteer cluster/browser.
     */
    async quit() {
        if (this.pluggable && this.pluggable.close_browser) {
            await this.pluggable.close_browser();
        } else {
            await this.cluster.idle();
            await this.cluster.close();
        }
    }
}

function parseEventData(config) {

    function _bool(e) {
        e = String(e);
        if (typeof e.trim === "function") {
            return e.trim().toLowerCase() === 'true';
        } else {
            return e.toLowerCase() === 'true';
        }
    }

    const booleans = ['upload_to_s3', 'log_ip_address', 'log_http_headers', 'random_user_agent',
        'compress', 'is_local', 'max_results', 'set_manual_settings', 'block_assets', 'test_evasion', 'do_work', 'apply_evasion_techniques'];

    for (b of booleans) {
        config[b] = _bool(config[b]);
    }

    if (config.sleep_range) {
        // parse an array
        config.sleep_range = eval(config.sleep_range);

        if (config.sleep_range.length !== 2 && typeof i[0] !== 'number' && typeof i[1] !== 'number') {
            throw "sleep_range is not a valid array of two integers.";
        }
    }

    return config;
}



module.exports = {
    ScrapeManager: ScrapeManager,
};