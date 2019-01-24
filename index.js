const handler = require('./src/node_scraper.js');
var fs = require('fs');
var os = require("os");

exports.scrape = function(config, callback) {
	// options for scraping
	event = {
		// the user agent to scrape with
		user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
		// if random_user_agent is set to True, a random user agent is chosen
		random_user_agent: false,
		// whether to select manual settings in visible mode
		set_manual_settings: 'false',
		// get meta data of scraping in return object
		write_meta_data: 'true',
		log_http_headers: 'false',
		// how long to sleep between requests. a random sleep interval within the range [a,b]
		// is drawn before every request. empty string for no sleeping.
		sleep_range: '[1,1]',
		// which search engine to scrape
		search_engine: 'google',
		compress: 'false', // compress
		debug: 'false',
		verbose: 'false',
		keywords: ['test'],
	};

	for (var key in config) {
		event[key] = config[key];
	}

	if (fs.existsSync(event.keyword_file)) {
		event.keywords = read_keywords_from_file(event.keyword_file);
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

	handler.handler(event, undefined, callback );
};

function read_keywords_from_file(fname) {
	let kws =  fs.readFileSync(fname).toString().split(os.EOL);
	// clean keywords
	kws = kws.filter((kw) => {
		return kw.trim().length > 0;
	});
	return kws;
}

function write_results(fname, data) {
	fs.writeFile(fname || 'results.json', data, (err) => {
		if (err) throw err;
		console.log('Results written to file');
	});
}