const se_scraper = require('./../index.js');

let config = {
    headless: false,
    search_engine: 'amazon',
    debug: false,
    verbose: false,
    keywords: ['iphone', 'drone'],
    num_pages: 1,
    output_file: 'examples/results/amazon.json',
    amazon_settings: {
        amazon_domain: 'amazon.com',
    }
};

function callback(err, response) {
    if (err) { console.error(err) }
    console.dir(response, {depth: null, colors: true});
}

se_scraper.scrape(config, callback);