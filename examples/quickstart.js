const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        debug_level: 1,
        output_file: 'examples/results/data.json',
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['news', 'se-scraper'],
        num_pages: 1,
        // add some cool google search settings
        google_settings: {
            gl: 'us', // The gl parameter determines the Google country to use for the query.
            hl: 'en', // The hl parameter determines the Google UI language to return results.
            start: 0, // Determines the results offset to use, defaults to 0.
            num: 100, // Determines the number of results to show, defaults to 10. Maximum is 100.
        },
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_job);

    console.dir(results, {depth: null, colors: true});

    await scraper.quit();
})();
