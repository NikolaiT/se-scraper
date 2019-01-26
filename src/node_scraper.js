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

module.exports.handler = async function handler (event, context, callback) {

	try {
		const startTime = Date.now();

		event = parseEventData(event);
		if (event.debug === true) {
			console.log(event);
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

        if (event.random_user_agent) {
            USER_AGENT = ua.random_user_agent();
		}

        if (event.user_agent) {
			USER_AGENT = event.user_agent;
		}

        if (USER_AGENT) {
			ADDITIONAL_CHROME_FLAGS.push(
				`--user-agent="${USER_AGENT}"`
			)
		}

        if (event.debug === true) {
            console.log("Chrome Flags: ", ADDITIONAL_CHROME_FLAGS);
        }

		browser = await puppeteer.launch({
			args: ADDITIONAL_CHROME_FLAGS,
			headless: event.headless !== false,
		});

		if (event.log_http_headers === true) {
			headers = await meta.get_http_headers(browser);
			console.dir(headers);
		}

		// TODO: this is ugly but I don't want to use to much objects and classes right now.
		if (event.search_engine == 'google') {
			results = await google.scrape_google_pup(browser, event, context);
		} else if (event.search_engine == 'google_news_old') {
			results = await google.scrape_google_news_old_pup(browser, event, context);
		} else if (event.search_engine == 'google_news') {
			results = await google.scrape_google_news_pup(browser, event, context);
		} else if (event.search_engine == 'google_image') {
			results = await google.scrape_google_image_pup(browser, event, context);
		} else if (event.search_engine == 'bing') {
			results = await bing.scrape_bing_pup(browser, event, context);
		} else if (event.search_engine == 'bing_news') {
			results = await bing.scrape_bing_news_pup(browser, event, context);
		} else if (event.search_engine == 'infospace') {
            results = await infospace.scrape_infospace_pup(browser, event, context);
        } else if (event.search_engine == 'webcrawler') {
		    results = await infospace.scrape_webcrawler_news_pup(browser, event, context);
        } else if (event.search_engine == 'baidu') {
			results = await baidu.scrape_baidu_pup(browser, event, context);
		} else if (event.search_engine == 'youtube') {
			results = await youtube.scrape_youtube_pup(browser, event, context);
		} else if (event.search_engine == 'duckduckgo_news') {
            results = await duckduckgo.scrape_duckduckgo_news_pup(browser, event, context);
		} else if (event.search_engine == 'google_dr') {
            results = await google.scrape_google_pup_dr(browser, event, context);
        } else if (event.search_engine == 'yahoo_news') {
			results = await tickersearch.scrape_yahoo_finance_pup(browser, event, context);
		}

        let metadata = {};

        if (event.write_meta_data === true) {
            metadata = await meta.get_metadata(browser);
        }

		await browser.close();

		let num_keywords = event.keywords.length || 0;
		let timeDelta = Date.now() - startTime;
		let ms_per_keyword = timeDelta/num_keywords;
		console.log(`Scraper took ${timeDelta}ms to scrape ${num_keywords} keywords.`);
		console.log(`On average ms/keyword: ${ms_per_keyword}ms/keyword`);

		if (event.verbose === true) {
			console.dir(results, {depth: null, colors: true});
		}

		if (event.compress === true) {
			results = JSON.stringify(results);
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
			results = zlib.deflateSync(results).toString('base64');
		}

		if (event.write_meta_data === true) {
            metadata.id = `${event.job_name} ${event.chunk_lines}`;
			metadata.chunk_lines = event.chunk_lines;
			metadata.elapsed_time = timeDelta.toString();
			metadata.ms_per_keyword = ms_per_keyword.toString();

			if (event.verbose === true) {
				console.log(metadata);
			}
		}

		if (event.output_file) {
			write_results(event.output_file, JSON.stringify(results));
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

function parseEventData(event) {

	function _bool(e) {
		e = String(e);
		if (typeof e.trim === "function") { 
		    return e.trim().toLowerCase() == 'true';
		} else {
			return e.toLowerCase() == 'true';
		}
	}

	if (event.debug) {
		event.debug = _bool(event.debug);
	}

	if (event.verbose) {
		event.verbose = _bool(event.verbose);
	}

	if (event.upload_to_s3) {
		event.upload_to_s3 = _bool(event.upload_to_s3);
	}

	if (event.write_meta_data) {
		event.write_meta_data = _bool(event.write_meta_data);
	}

	if (event.log_http_headers) {
		event.log_http_headers = _bool(event.log_http_headers);
	}

	if (event.compress) {
		event.compress = _bool(event.compress);
	}

	if (event.is_local) {
		event.is_local = _bool(event.is_local);
	}

	if (event.max_results) {
		event.max_results = parseInt(event.max_results);
	}

	if (event.set_manual_settings) {
		event.set_manual_settings = _bool(event.set_manual_settings);
	}

	if (event.sleep_range) {
		// parse an array
		event.sleep_range = eval(event.sleep_range);

		if (event.sleep_range.length !== 2 && typeof i[0] !== 'number' && typeof i[1] !== 'number') {
            throw "sleep_range is not a valid array of two integers.";
		}
	}

	return event;
}