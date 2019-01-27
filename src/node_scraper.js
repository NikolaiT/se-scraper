const puppeteer = require('puppeteer');
const zlib = require('zlib');
var fs = require('fs');

// local module imports
const google = require('./modules/google.js');
const bing = require('./modules/bing.js');
const baidu = require('./modules/baidu.js');
const infospace = require('./modules/infospace.js');
const youtube = require('./modules/youtube.js');
const ua = require('./modules/user_agents.js');
const meta = require('./modules/metadata.js');
const duckduckgo = require('./modules/duckduckgo.js');
const tickersearch = require('./modules/ticker_search.js');

function write_results(fname, data) {
	fs.writeFileSync(fname, data, (err) => {
		if (err) throw err;
		console.log(`Results written to file ${fname}`);
	});
}

module.exports.handler = async function handler (config, context, callback) {
	pluggable = null;
	if (config.custom_func && fs.existsSync(config.custom_func)) {
		try {
			Pluggable = require(config.custom_func);
			pluggable = new Pluggable();
		} catch (exception) {
			console.error(exception);
		}
	}

	try {
		const startTime = Date.now();

		config = parseEventData(config);
		if (config.debug === true) {
			console.log(config);
		}

        const ADDITIONAL_CHROME_FLAGS = [
			//'--proxy-server=' + proxy,
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-accelerated-2d-canvas',
			'--disable-gpu',
			'--window-size=1920x1080',
            '--hide-scrollbars',
        ];

		let USER_AGENT = '';

        if (config.random_user_agent) {
            USER_AGENT = ua.random_user_agent();
		}

        if (config.user_agent) {
			USER_AGENT = config.user_agent;
		}

        if (USER_AGENT) {
			ADDITIONAL_CHROME_FLAGS.push(
				`--user-agent="${USER_AGENT}"`
			)
		}

        let launch_args = {
			args: ADDITIONAL_CHROME_FLAGS,
			headless: config.headless !== false,
		};

		if (config.debug === true) {
			console.log("Chrome Args: ", launch_args);
		}

        if (pluggable) {
			launch_args.config = config;
			browser = await pluggable.start_browser(launch_args);
		} else {
			browser = await puppeteer.launch(launch_args);
		}

		if (config.log_http_headers === true) {
			headers = await meta.get_http_headers(browser);
			console.dir(headers);
		}

		const page = await browser.newPage();

		if (config.block_assets === true) {
			await page.setRequestInterception(true);

			page.on('request', (req) => {
				if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
					req.abort();
				} else {
					req.continue();
				}
			});
		}

		results = await {
			google: google.scrape_google_pup,
			google_news_old: google.scrape_google_news_old_pup,
			google_news: google.scrape_google_news_pup,
			google_image: google.scrape_google_image_pup,
			bing: bing.scrape_bing_pup,
			bing_news: bing.scrape_bing_news_pup,
			infospace: infospace.scrape_infospace_pup,
			webcrawler: infospace.scrape_webcrawler_news_pup,
			baidu: baidu.scrape_baidu_pup,
			youtube: youtube.scrape_youtube_pup,
			duckduckgo_news: duckduckgo.scrape_duckduckgo_news_pup,
			google_dr: google.scrape_google_pup_dr,
			yahoo_news: tickersearch.scrape_yahoo_finance_pup,
			bloomberg: tickersearch.scrape_bloomberg_finance_pup,
			reuters: tickersearch.scrape_reuters_finance_pup,
			cnbc: tickersearch.scrape_cnbc_finance_pup,
			marketwatch: tickersearch.scrape_marketwatch_finance_pup,
		}[config.search_engine](page, config, context);

        let metadata = {};

        if (config.write_meta_data === true) {
            metadata = await meta.get_metadata(browser);
        }

		if (pluggable) {
			await pluggable.close_browser();
		} else {
			await browser.close();
		}

		let num_keywords = config.keywords.length || 0;
		let timeDelta = Date.now() - startTime;
		let ms_per_keyword = timeDelta/num_keywords;

		if (config.verbose === true) {
			console.log(`Scraper took ${timeDelta}ms to scrape ${num_keywords} keywords.`);
			console.log(`On average ms/keyword: ${ms_per_keyword}ms/keyword`);
			console.dir(results, {depth: null, colors: true});
		}

		if (config.compress === true) {
			results = JSON.stringify(results);
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
			results = zlib.deflateSync(results).toString('base64');
		}

		if (config.write_meta_data === true) {
            metadata.id = `${config.job_name} ${config.chunk_lines}`;
			metadata.chunk_lines = config.chunk_lines;
			metadata.elapsed_time = timeDelta.toString();
			metadata.ms_per_keyword = ms_per_keyword.toString();

			if (config.verbose === true) {
				console.log(metadata);
			}

			if (pluggable) {
				await pluggable.handle_metadata({metadata: metadata, config: config});
			}
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
		    return e.trim().toLowerCase() == 'true';
		} else {
			return e.toLowerCase() == 'true';
		}
	}

	if (config.debug) {
		config.debug = _bool(config.debug);
	}

	if (config.verbose) {
		config.verbose = _bool(config.verbose);
	}

	if (config.upload_to_s3) {
		config.upload_to_s3 = _bool(config.upload_to_s3);
	}

	if (config.write_meta_data) {
		config.write_meta_data = _bool(config.write_meta_data);
	}

	if (config.log_http_headers) {
		config.log_http_headers = _bool(config.log_http_headers);
	}

	if (config.compress) {
		config.compress = _bool(config.compress);
	}

	if (config.is_local) {
		config.is_local = _bool(config.is_local);
	}

	if (config.max_results) {
		config.max_results = parseInt(config.max_results);
	}

	if (config.set_manual_settings) {
		config.set_manual_settings = _bool(config.set_manual_settings);
	}

	if (config.block_assets) {
		config.block_assets = _bool(config.block_assets);
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