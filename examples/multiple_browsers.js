const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        search_engine: 'google',
        random_user_agent: true,
        is_local: false,
        html_output: false,
        throw_on_detection: false,
        headless: true,
        puppeteer_cluster_config: {
            headless: true,
            timeout: 30 * 60 * 1000, // max timeout set to 30 minutes
            monitor: false,
            concurrency: 3, // 3 == CONCURRENCY_BROWSER
            maxConcurrency: 3, // 3 browsers will scrape
        },
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['news', 'mountain', 'what', 'are good', 'keyword', 'who', 'nice'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_job);

    console.dir(results, {depth: null, colors: true});

    await scraper.quit();
})();
