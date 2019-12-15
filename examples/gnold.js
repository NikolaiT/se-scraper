const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        output_file: 'examples/results/gnold.json',
        google_news_old_settings: {
            gl: 'us', // The gl parameter determines the Google country to use for the query.
            hl: 'fr', // The hl parameter determines the Google UI language to return results.
            start: 0, // Determines the results offset to use, defaults to 0.
            num: 100, // Determines the number of results to show, defaults to 10. Maximum is 100.
        },
    };

    let scrape_job = {
        search_engine: 'google_news_old',
        keywords: ['news world'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);
    await scraper.start();

    var results = await scraper.scrape(scrape_job);
    console.dir(results, {depth: null, colors: true});
    await scraper.quit();
})();
