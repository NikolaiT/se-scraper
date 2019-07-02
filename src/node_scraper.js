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

const MAX_ALLOWED_BROWSERS = 6;

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


function getScraper(search_engine, args) {
    if (typeof search_engine === 'string') {
        return new {
            google: google.GoogleScraper,
            google_news_old: google.GoogleNewsOldScraper,
            google_news: google.GoogleNewsScraper,
            google_image: google.GoogleImageScraper,
            google_maps: google.GoogleMapsScraper,
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
        }[search_engine](args);
    } else if (typeof search_engine === 'function') {
        return new search_engine(args);
    } else {
        throw new Error(`search_engine must either be a string of class (function)`);
    }
}


class ScrapeManager {

    constructor(config, context={}) {

        this.cluster = null;
        this.pluggable = null;
        this.scraper = null;
        this.context = context;

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
            // you may pass your own list of user agents
            user_agents: [],
            apply_evasion_techniques: true,
            // settings for puppeteer-cluster
            puppeteer_cluster_config: {
                timeout: 30 * 60 * 1000, // max timeout set to 30 minutes
                monitor: false,
                concurrency: Cluster.CONCURRENCY_BROWSER,
                maxConcurrency: 1,
            }
        };

        this.config.proxies = [];

        // overwrite default config
        for (var key in config) {
            this.config[key] = config[key];
        }

        if (config.sleep_range) {
            // parse an array
            config.sleep_range = eval(config.sleep_range);

            if (config.sleep_range.length !== 2 && typeof i[0] !== 'number' && typeof i[1] !== 'number') {
                throw "sleep_range is not a valid array of two integers.";
            }
        }

        this.config.search_engine_name = typeof this.config.search_engine === 'function' ? this.config.search_engine.name : this.config.search_engine;

        if (fs.existsSync(this.config.keyword_file)) {
            this.config.keywords = read_keywords_from_file(this.config.keyword_file);
        }

        if (fs.existsSync(this.config.proxy_file)) {
            this.config.proxies = read_keywords_from_file(this.config.proxy_file);
            log(this.config, 1, `${this.config.proxies.length} proxies read from file.`);
        }

        log(this.config, 2, this.config);
    }

    /*
     * Launches the puppeteer cluster or browser.
     *
     * Returns true if the browser was successfully launched. Otherwise will return false.
     */
    async start() {

        if (this.config.custom_func) {
            if (fs.existsSync(this.config.custom_func)) {
                try {
                    const PluggableClass = require(this.config.custom_func);
                    this.pluggable = new PluggableClass({config: this.config});
                } catch (exception) {
                    console.error(exception);
                    return false;
                }
            } else {
                console.error(`File "${this.config.custom_func}" does not exist!`);
                return false;
            }
        }

        // See here: https://peter.sh/experiments/chromium-command-line-switches/
        var default_chrome_flags = [
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1040',
            '--start-fullscreen',
            '--hide-scrollbars',
            '--disable-notifications',
        ];

        var chrome_flags = default_chrome_flags.slice(); // copy that

        if (Array.isArray(this.config.chrome_flags) && this.config.chrome_flags.length) {
            chrome_flags = this.config.chrome_flags;
        }

        var user_agent = null;

        if (this.config.user_agent) {
            user_agent = this.config.user_agent;
        }

        if (this.config.random_user_agent === true) {
            user_agent = ua.random_user_agent(this.config);
        }

        if (user_agent) {
            chrome_flags.push(
                `--user-agent=${user_agent}`
            )
        }

        if (this.config.proxy) {
            if (this.config.proxies && this.config.proxies.length > 0) {
                console.error('Either use a proxy_file or specify a proxy for all connections. Do not use both options.');
                return false;
            }

            chrome_flags.push(
                '--proxy-server=' + this.config.proxy,
            )
        }

        var launch_args = {
            args: chrome_flags,
            headless: this.config.headless,
            ignoreHTTPSErrors: true,
        };

        log(this.config, 2, `Using the following puppeteer configuration: ${launch_args}`);

        if (this.pluggable) {
            launch_args.config = this.config;
            this.browser = await this.pluggable.start_browser(launch_args);
            this.page = await this.browser.newPage();
        } else {
            // if no custom start_browser functionality was given
            // use puppeteer-cluster for scraping
            const { Cluster } = require('./puppeteer-cluster/dist/index.js');

            this.numClusters = this.config.puppeteer_cluster_config.maxConcurrency;
            var perBrowserOptions = [];

            // the first browser this.config with home IP
            if (!this.config.use_proxies_only) {
                perBrowserOptions.push(launch_args);
            }

            // if we have at least one proxy, always use CONCURRENCY_BROWSER
            // and set maxConcurrency to this.config.proxies.length + 1
            // else use whatever this.configuration was passed
            if (this.config.proxies.length > 0) {
                this.config.puppeteer_cluster_config.concurrency = Cluster.CONCURRENCY_BROWSER;

                // because we use real browsers, we ran out of memory on normal laptops
                // when using more than maybe 5 or 6 browsers.
                // therefore hardcode a limit here
                this.numClusters = Math.min(
                    this.config.proxies.length + (this.config.use_proxies_only ? 0 : 1),
                    MAX_ALLOWED_BROWSERS
                );

                log(this.config, 1, `Using ${this.numClusters} clusters.`);

                this.config.puppeteer_cluster_config.maxConcurrency = this.numClusters;

                for (var proxy of this.config.proxies) {
                    perBrowserOptions.push({
                        headless: this.config.headless,
                        ignoreHTTPSErrors: true,
                        args: chrome_flags.concat(`--proxy-server=${proxy}`)
                    })
                }
            }

            // Give the per browser options each a random user agent when random user agent is set
            while (perBrowserOptions.length < this.numClusters) {
                perBrowserOptions.push({
                    headless: this.config.headless,
                    ignoreHTTPSErrors: true,
                    args: default_chrome_flags.slice().concat(`--user-agent=${ua.random_user_agent(this.config)}`)
                })
            }

            if (this.config.debug_level >= 2) {
                console.dir(perBrowserOptions)
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
                console.log(err);
            });
        }
    }

    /*
     * Scrapes the keywords specified by the config.
     */
    async scrape(scrape_config = {}) {

        if (!scrape_config.keywords && !scrape_config.keyword_file) {
            console.error('Either keywords or keyword_file must be supplied to scrape()');
            return false;
        }

        Object.assign(this.config, scrape_config);

        var results = {};
        var html_output = {};
        var num_requests = 0;
        var metadata = {};

        var startTime = Date.now();

        if (this.config.keywords && this.config.search_engine) {
            log(this.config, 1,
                `[se-scraper] started at [${(new Date()).toUTCString()}] and scrapes ${this.config.search_engine_name} with ${this.config.keywords.length} keywords on ${this.config.num_pages} pages each.`)
        }

        if (this.pluggable) {
            this.scraper = getScraper(this.config.search_engine, {
                config: this.config,
                context: this.context,
                pluggable: this.pluggable,
                page: this.page,
            });

            let res = await this.scraper.run(this.page);
            results = res.results;
            num_requests = this.scraper.num_requests;
        } else {
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

                if (this.config.use_proxies_only) {
                    this.config.proxy = this.config.proxies[c]; // every cluster has a dedicated proxy
                } else if(c > 0) {
                    this.config.proxy = this.config.proxies[c-1]; // first cluster uses own ip address
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

            let promiseReturns = await Promise.all(execPromises);

            // Merge results per keyword
            for (let promiseReturn of promiseReturns) {
                for (let keyword of this.config.keywords) {
                    results[keyword] = promiseReturn.results[keyword];
                    html_output[keyword] = promiseReturn.html_output[keyword];
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
            log(this.config, 1, `Writing results to ${this.config.output_file}`);
            write_results(this.config.output_file, JSON.stringify(results, null, 4));
        }

        return {
            results: results,
            html_output: (this.config.html_output) ? html_output : undefined,
            metadata: metadata || {},
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

module.exports = {
    ScrapeManager: ScrapeManager,
};
