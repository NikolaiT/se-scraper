const { Cluster } = require('./puppeteer-cluster/dist/index.js');
const zlib = require('zlib');
var fs = require('fs');

// local module imports
const google = require('./modules/google.js');
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

module.exports.handler = async function handler (event, context, callback) {
    config = event;
    pluggable = {};
    if (config.custom_func) {
        if (fs.existsSync(config.custom_func)) {
            try {
                Pluggable = require(config.custom_func);
                pluggable = new Pluggable({config: config});
            } catch (exception) {
                console.error(exception);
            }
        } else {
            console.error(`File "${config.custom_func}" does not exist...`);
        }
    }

    try {
        const startTime = Date.now();
        config = parseEventData(config);
        if (config.debug === true) {
            console.log(config);
        }

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

        var user_agent = undefined;

        if (config.user_agent) {
            user_agent = config.user_agent;
        }

        if (config.random_user_agent === true) {
            user_agent = ua.random_user_agent();
        }

        if (user_agent) {
            ADDITIONAL_CHROME_FLAGS.push(
                `--user-agent="${user_agent}"`
            )
        }

        if (config.proxy) {
            // https://www.systutorials.com/241062/how-to-set-google-chromes-proxy-settings-in-command-line-on-linux/
            // [<proxy-scheme>://]<proxy-host>[:<proxy-port>]
            // "http", "socks", "socks4", "socks5".
            ADDITIONAL_CHROME_FLAGS.push(
                '--proxy-server=' + config.proxy,
            )
        }

        let launch_args = {
            args: ADDITIONAL_CHROME_FLAGS,
            headless: config.headless,
            ignoreHTTPSErrors: true,
        };

        if (config.debug === true) {
            console.log("Chrome Args: ", launch_args);
        }

        if (pluggable.start_browser) {
            launch_args.config = config;
            browser = await pluggable.start_browser(launch_args);
        } else {
            var numClusters = config.proxies.length + 1;

            // the first browser config with home IP
            let perBrowserOptions = [launch_args, ];

            for (var proxy of config.proxies) {
                perBrowserOptions.push({
                    headless: config.headless,
                    ignoreHTTPSErrors: true,
                    args: ADDITIONAL_CHROME_FLAGS.concat(`--proxy-server=${proxy}`)
                })
            }

            var cluster = await Cluster.launch({
                monitor: config.monitor,
                timeout: 30 * 60 * 1000, // max timeout set to 30 minutes
                concurrency: Cluster.CONCURRENCY_BROWSER,
                maxConcurrency: numClusters,
                puppeteerOptions: launch_args,
                perBrowserOptions: perBrowserOptions
            });

            cluster.on('taskerror', (err, data) => {
                console.log(`Error while scraping ${data}: ${err.message}`);
                console.log(err)
            });
        }

        let metadata = {};

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
        //console.log(`Generated ${chunks.length} chunks...`);

        let execPromises = [];
        let scraperInstances = [];
        for (var c = 0; c < chunks.length; c++) {
            config.keywords = chunks[c];
            if (c>0) {
                config.proxy = config.proxies[c];
            }
            obj = getScraper(config.search_engine, {
                config: config,
                context: context,
                pluggable: pluggable,
            });
            var boundMethod = obj.run.bind(obj);
            execPromises.push(cluster.execute({}, boundMethod));
            scraperInstances.push(obj);
        }

        let results = await Promise.all(execPromises);
        results = results[0]; // TODO: this is strange. fix that shit boy

        if (pluggable.close_browser) {
            await pluggable.close_browser();
        } else {
            await cluster.idle();
            await cluster.close();
        }

        // count total requests among all scraper instances
        let num_requests = 0;
        for (var o of scraperInstances) {
            num_requests += o.num_requests;
        }

        let timeDelta = Date.now() - startTime;
        let ms_per_request = timeDelta/num_requests;

        if (config.verbose === true) {
            console.log(`${numClusters} Scraper Workers took ${timeDelta}ms to perform ${num_requests} requests.`);
            console.log(`On average ms/request: ${ms_per_request}ms/request`);
            console.dir(results, {depth: null, colors: true});
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

        metadata.id = `${config.job_name} ${config.chunk_lines}`;
        metadata.chunk_lines = config.chunk_lines;
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
            write_results(config.output_file, JSON.stringify(results));
        }

        let response = {
          headers: {
            'Content-Type': 'text/json',
          },
          results: results,
          metadata: metadata || {},
          statusCode: 200
        };

        callback(null, response);

    }  catch (e) {
        callback(e, null);
    }
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
        'compress', 'is_local', 'max_results', 'set_manual_settings', 'block_assets', 'test_evasion'];

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