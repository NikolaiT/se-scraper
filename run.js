const se_scraper = require('./index.js');
const resolve = require('path').resolve;

let config = {
    // the user agent to scrape with
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
    // if random_user_agent is set to True, a random user agent is chosen
    random_user_agent: false,
    // get meta data of scraping in return object
    write_meta_data: false,
    // how long to sleep between requests. a random sleep interval within the range [a,b]
    // is drawn before every request. empty string for no sleeping.
    sleep_range: '',
    // which search engine to scrape
    search_engine: 'google',
    // whether debug information should be printed
    // debug info is useful for developers when debugging
    debug: false,
    // whether verbose program output should be printed
    // this output is informational
    verbose: false,
    // an array of keywords to scrape
    keywords: ['scrapeulous.com', ],
    // alternatively you can specify a keyword_file. this overwrites the keywords array
    keyword_file: '',
    // whether to start the browser in headless mode
    headless: true,
    // path to output file, data will be stored in JSON
    output_file: 'data.json',
    // whether to prevent images, css, fonts from being loaded
    // will speed up scraping a great deal
    block_assets: true,
    // path to js module that extends functionality
    // this module should export the functions:
    // get_browser, handle_metadata, close_browser
    // must be an absolute path to the module
    //custom_func: resolve('examples/pluggable.js'),
    custom_func: '',
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
