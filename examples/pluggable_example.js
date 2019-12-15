const se_scraper = require('./../src/node_scraper.js');
const resolve = require('path').resolve;

(async () => {
    let browser_config = {
        test_evasion: false,
        log_http_headers: true,
        log_ip_address: true,
        random_user_agent: false,
        apply_evasion_techniques: false,
        screen_output: false,
        custom_func: resolve('./examples/pluggable.js'),
        headless: false,
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['news usa'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_job);

    console.dir(results, {depth: null, colors: true});

    await scraper.quit();
})();
