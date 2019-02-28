const se_scraper = require('./../index.js');

let config = {
    search_engine: 'google',
    debug: false,
    verbose: false,
    keywords: ['news', 'se-scraper'],
    num_pages: 1,
    output_file: 'examples/results/data.json',
};

function callback(err, response) {
    if (err) { console.error(err) }
    console.dir(response, {depth: null, colors: true});
}

se_scraper.scrape(config, callback);