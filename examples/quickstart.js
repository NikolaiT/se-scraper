const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        debug_level: 1,
        test_evasion: false,
        headless: false,
        block_assets: false,
        random_user_agent: false,
        log_http_headers: false,
        html_output: false,
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['mercedes reifen'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_job);

    console.dir(results, {depth: null, colors: true});

    await scraper.quit();
})();
