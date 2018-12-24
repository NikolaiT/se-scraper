const se_scraper = require('./index.js');

let config = {
    // the user agent to scrape with
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
    // if random_user_agent is set to True, a random user agent is chosen
    random_user_agent: false,
    // get meta data of scraping in return object
    write_meta_data: 'true',
    // how long to sleep between requests. a random sleep interval within the range [a,b]
    // is drawn before every request. empty string for no sleeping.
    sleep_range: '[1,1]',
    // which search engine to scrape
    search_engine: 'google',
    // whether debug information should be printed
    debug: 'true',
    // whether verbose program output should be printed
    verbose: 'false',
    // an array of keywords to scrape
    keywords: ['incolumitas.com scraping', 'best scraping framework'],
};

se_scraper.scrape(config, (err, response) => {
    if (err) { console.error(err) }

    /* response object has the following properties:

        response.results - json object with the scraping results
        response.metadata - json object with metadata information
        response.statusCode - status code of the scraping process
     */

    console.dir(response.results, {depth: null, colors: true});
});
