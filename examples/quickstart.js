const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        debug_level: 1,
        test_evasion: false,
        log_http_headers: true,
        random_user_agent: true,
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['too tired all the time'],
        num_pages: 1,
        google_settings: {
            "gl": "us",
            "hl": "en",
            "start": 0,
            "num": 10
        }
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_job);

    console.dir(results, {depth: null, colors: true});

    await scraper.quit();
})();
