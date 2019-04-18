const zlib = require('zlib');
var fs = require('fs');
const google = require('./modules/google.js');
const amazon = require('./modules/amazon.js');
const bing = require('./modules/bing.js');
const baidu = require('./modules/baidu.js');
const infospace = require('./modules/infospace.js');
const youtube = require('./modules/youtube.js');
const ua = require('./modules/user_agents.js');
const duckduckgo = require('./modules/duckduckgo.js');
const tickersearch = require('./modules/ticker_search.js');

function write_results(fname, data) {
    fs.writeFileSync(fname, data, (err) => {
        if (err) throw err;
        console.log(`Results written to file ${fname}`);
    });
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

module.exports.handler = async function handler (event, context) {
    let config = event;
    let pluggable = {};
    if (config.custom_func) {
        if (fs.existsSync(config.custom_func)) {
            Pluggable = require(config.custom_func);
            pluggable = new Pluggable({config: config});
        } else {
            console.error(`File "${config.custom_func}" does not exist...`);
        }
    }

    const startTime = Date.now();
    config = parseEventData(config);
    if (config.debug === true) {
        console.log(config);
    }

    if (config.keywords && config.search_engine) {
        console.log(`[se-scraper] started at [${(new Date()).toUTCString()}] and scrapes ${config.search_engine} with ${config.keywords.length} keywords on ${config.num_pages} pages each.`);
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

    if (Array.isArray(config.chrome_flags) && config.chrome_flags.length) {
        chrome_flags = config.chrome_flags;
    }

    var user_agent = null;

    if (config.user_agent) {
        user_agent = config.user_agent;
    }

    if (config.random_user_agent === true) {
        user_agent = ua.random_user_agent();
    }

    if (user_agent) {
        chrome_flags.push(
            `--user-agent=${user_agent}`
        )
    }

    if (config.proxy) {
        chrome_flags.push(
            '--proxy-server=' + config.proxy,
        )
    }

    let launch_args = {
        args: chrome_flags,
        headless: config.headless,
        ignoreHTTPSErrors: true,
    };

    if (config.debug === true) {
        console.log('Using the following puppeteer configuration: ');
        console.dir(launch_args);
    }

    var results = {};
    var num_requests = 0;
    var metadata = {};

    if (pluggable.start_browser) {
        launch_args.config = config;
        let browser = await pluggable.start_browser(launch_args);

        const page = await browser.newPage();

        if (config.do_work && pluggable.do_work) {
            let res = await pluggable.do_work(page);
            results = res.results;
            num_requests = res.num_requests;
        } else {
            let obj = getScraper(config.search_engine, {
                config: config,
                context: context,
                pluggable: pluggable,
                page: page,
            });
            results = await obj.run({});
            num_requests = obj.num_requests;
            metadata = obj.metadata;
        }

        if (pluggable.close_browser) {
            await pluggable.close_browser();
        } else {
            await browser.close();
        }

    } else {

        // if no custom start_browser functionality was given
        // use puppeteer-cluster for scraping
        const { Cluster } = require('./puppeteer-cluster/dist/index.js');

        var numClusters = config.puppeteer_cluster_config.maxConcurrency;
        var perBrowserOptions = [];

        // if we have at least one proxy, always use CONCURRENCY_BROWSER
        // and set maxConcurrency to config.proxies.length + 1
        // else use whatever configuration was passed
        if (config.proxies.length > 0) {
            config.puppeteer_cluster_config.concurrency = Cluster.CONCURRENCY_BROWSER;
            // because we use real browsers, we ran out of memory on normal laptops
            // when using more than maybe 5 or 6 browsers.
            // therfore hardcode a limit here
            numClusters = Math.min(config.proxies.length + 1, 5);
            config.puppeteer_cluster_config.maxConcurrency = numClusters;

            // the first browser config with home IP
            perBrowserOptions = [launch_args, ];

            for (var proxy of config.proxies) {
                perBrowserOptions.push({
                    headless: config.headless,
                    ignoreHTTPSErrors: true,
                    args: chrome_flags.concat(`--proxy-server=${proxy}`)
                })
            }
        }

        var cluster = await Cluster.launch({
            monitor: config.puppeteer_cluster_config.monitor,
            timeout: config.puppeteer_cluster_config.timeout, // max timeout set to 30 minutes
            concurrency: config.puppeteer_cluster_config.concurrency,
            maxConcurrency: config.puppeteer_cluster_config.maxConcurrency,
            puppeteerOptions: launch_args,
            perBrowserOptions: perBrowserOptions,
        });

        cluster.on('taskerror', (err, data) => {
            console.log(`Error while scraping ${data}: ${err.message}`);
            console.log(err)
        });

        // Each browser will get N/(K+1) keywords and will issue N/(K+1) * M total requests to the search engine.
        // https://github.com/GoogleChrome/puppeteer/issues/678
        // The question is: Is it possible to set proxies per Page? Per Browser?
        // as far as I can see, puppeteer cluster uses the same puppeteerOptions
        // for every browser instance. We will use our custom puppeteer-cluster version.
        // https://www.npmjs.com/package/proxy-chain
        // this answer looks nice: https://github.com/GoogleChrome/puppeteer/issues/678#issuecomment-389096077
        let chunks = [];
        for (var n = 0; n < numClusters; n++) {
            chunks.push([]);
        }
        for (var k = 0; k < config.keywords.length; k++) {
            chunks[k%numClusters].push(config.keywords[k]);
        }

        let execPromises = [];
        let scraperInstances = [];
        for (var c = 0; c < chunks.length; c++) {
            config.keywords = chunks[c];
            // the first scraping config uses the home IP
            if (c > 0) {
                config.proxy = config.proxies[c-1];
            }
            var obj = getScraper(config.search_engine, {
                config: config,
                context: context,
                pluggable: pluggable,
            });

            var boundMethod = obj.run.bind(obj);
            execPromises.push(cluster.execute({}, boundMethod));
            scraperInstances.push(obj);
        }

        let resolved = await Promise.all(execPromises);

        for (var group of resolved) {
            for (var key in group) {
                results[key] = group[key];
            }
        }

        await cluster.idle();
        await cluster.close();

        // count total requests among all scraper instances
        for (var o of scraperInstances) {
            num_requests += o.num_requests;
        }
    }

    let timeDelta = Date.now() - startTime;
    let ms_per_request = timeDelta/num_requests;

    if (config.verbose === true) {
        console.log(`Scraper took ${timeDelta}ms to perform ${num_requests} requests.`);
        console.log(`On average ms/request: ${ms_per_request}ms/request`);
    }

    if (config.compress === true) {
        results = JSON.stringify(results);
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
        results = zlib.deflateSync(results).toString('base64');
    }

    if (pluggable.handle_results) {
        await pluggable.handle_results({
            config: config,
            results: results,
        });
    }

    if (config.chunk_lines) {
        metadata.chunk_lines = config.chunk_lines;
        if (config.job_name) {
            metadata.id = `${config.job_name} ${config.chunk_lines}`;
        }
    }

    metadata.elapsed_time = timeDelta.toString();
    metadata.ms_per_keyword = ms_per_request.toString();
    metadata.num_requests = num_requests;

    if (config.verbose === true) {
        console.log(metadata);
    }

    if (pluggable.handle_metadata) {
        await pluggable.handle_metadata({metadata: metadata, config: config});
    }

    if (config.output_file) {
        write_results(config.output_file, JSON.stringify(results, null, 4));
    }

    let response = {
        headers: {
            'Content-Type': 'text/json',
        },
        results: results,
        metadata: metadata || {},
        statusCode: 200
    };

    return response;
};

function parseEventData(config) {

    function _bool(e) {
        e = String(e);
        if (typeof e.trim === "function") {
            return e.trim().toLowerCase() === 'true';
        } else {
            return e.toLowerCase() === 'true';
        }
    }

    const booleans = ['debug', 'verbose', 'upload_to_s3', 'log_ip_address', 'log_http_headers', 'random_user_agent',
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
