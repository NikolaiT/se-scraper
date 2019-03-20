const se_scraper = require('./../index.js');

let config = {
    search_engine: 'google_news_old',
    debug: false,
    verbose: true,
    keywords: ['world news'],
    num_pages: 1,
    output_file: 'examples/results/gnold.json',
    google_news_old_settings: {
        gl: 'us', // The gl parameter determines the Google country to use for the query.
        hl: 'fr', // The hl parameter determines the Google UI language to return results.
        start: 0, // Determines the results offset to use, defaults to 0.
        num: 100, // Determines the number of results to show, defaults to 10. Maximum is 100.
    },
};

function callback(err, response) {
    if (err) { console.error(err) }
    console.dir(response, {depth: null, colors: true});
}

se_scraper.scrape(config, callback);
