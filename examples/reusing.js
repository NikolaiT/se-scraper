const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        output_file: 'examples/results/data.json',
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['news', 'se-scraper'],
        num_pages: 1,
    };

    let scrape_job2 = {
        search_engine: 'bing',
        keywords: ['test', 'what a wonderful world'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);
    await scraper.start();

    var results = await scraper.scrape(scrape_job);
    console.dir(results, {depth: null, colors: true});

    var results2 = await scraper.scrape(scrape_job2);
    console.dir(results2, {depth: null, colors: true});

    await scraper.quit();
})();
