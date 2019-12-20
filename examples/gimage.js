const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        output_file: '',
    };

    let scrape_job = {
        search_engine: 'google_image',
        keywords: ['manaslu', 'everest', 'pitcairn'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_job);

    console.dir(results, {depth: null, colors: true});

    await scraper.quit();
})();
