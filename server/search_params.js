const se_scraper = require('../src/node_scraper.js');


(async () => {
    const Cluster = {
        CONCURRENCY_PAGE: 1, // shares cookies, etc.
        CONCURRENCY_CONTEXT: 2, // no cookie sharing (uses contexts)
        CONCURRENCY_BROWSER: 3, // no cookie sharing and individual processes (uses contexts)
    };
    let browser_config = {
        search_engine: 'google',
        debug_level: 1,
        sleep_range: [1,2],
        output_file: 'google.json',
        random_user_agent: true,
        use_proxies_only: true,
        //chrome_flags: ['--proxy-server=http://0.0.0.0:55555'],
        // proxy: 'http://0.0.0.0:55555',
        proxies: ['http://0.0.0.0:55555',
        'http://0.0.0.0:55556',
        'http://0.0.0.0:55557'],
        is_local: false,
        throw_on_detection: false,
        headless: false,
        puppeteer_cluster_config: {
            headless: false,
            timeout: 30 * 60 * 1000, // max timeout set to 30 minutes
            monitor: false,
            concurrency: Cluster.CONCURRENCY_PAGE, // 3 == CONCURRENCY_BROWSER
            maxConcurrency: 1, // 3 browsers will scrape
        },
    };
    let keywords = ['site:twitter.com Donald trump',
    'link:dataflowkit.com',
    'inurl:view/view.shtml'
    ];
    let scrape_job = {
        random_user_agent: true,
        search_engine: 'google',
        keywords: keywords,
        num_pages: 1
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_job);

    console.dir(results, {depth: null, colors: true});

    await scraper.quit();
})();
