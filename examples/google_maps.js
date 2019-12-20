const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        output_file: 'examples/results/maps.json',
        test_evasion: false,
        block_assets: false,
        headless: false,

        google_maps_settings: {
            scrape_in_detail: false,
        }
    };

    let scrape_job = {
        search_engine: 'google_maps',
        keywords: ['Berlin Zahnarzt'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_job);

    console.dir(results, {depth: null, colors: true});

    await scraper.quit();
})();
