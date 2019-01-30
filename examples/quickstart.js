const se_scraper = require('./../index.js');

let config = {
    search_engine: 'duckduckgo',
    debug: false,
    verbose: false,
    keywords: ['news'],
    num_pages: 2,
    output_file: 'data.json',
};

function callback(err, response) {
    if (err) { console.error(err) }
    console.dir(response, {depth: null, colors: true});
}

se_scraper.scrape(config, callback);