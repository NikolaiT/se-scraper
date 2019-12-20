const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        random_user_agent: true,
        write_meta_data: true,
        sleep_range: '[1,1]',
        headless: true,
        output_file: `examples/results/multiple_search_engines.json`
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['news', 'se-scraper'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);
    await scraper.start();

    for (var se of ['google', 'bing']) {
        scrape_job.search_engine = se;
        var results = await scraper.scrape(scrape_job);
        console.dir(results, {depth: null, colors: true});
    }

    await scraper.quit();
})();

