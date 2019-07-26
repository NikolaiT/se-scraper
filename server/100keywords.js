const se_scraper = require('../src/node_scraper.js');


(async () => {
    const Cluster = {
        CONCURRENCY_PAGE: 1, // shares cookies, etc.
        CONCURRENCY_CONTEXT: 2, // no cookie sharing (uses contexts)
        CONCURRENCY_BROWSER: 3, // no cookie sharing and individual processes (uses contexts)
    };
    let browser_config = {
        //search_engine: 'bing',
        debug_level: 1,
        sleep_range: [1,3],
        //output_file: 'bing.json',
        block_assets: true,
        random_user_agent: true,
        use_proxies_only: true,
        //chrome_flags: ['--proxy-server=http://0.0.0.0:55555'],
        // proxy: 'http://0.0.0.0:55555',
        //proxy_file: 'proxy_list', 
        proxies: ['http://0.0.0.0:55555',
        'http://0.0.0.0:55556',
        'http://0.0.0.0:55557'
        ],
        is_local: false,
        throw_on_detection: false,
        headless: false,
        puppeteer_cluster_config: {
            headless: false,
            timeout: 12 * 60 * 60 * 1000, // max timeout set to 12 hours
            monitor: false,
            concurrency: Cluster.CONCURRENCY_BROWSER, //!!!DON't change 3 == CONCURRENCY_BROWSER
            maxConcurrency: 1, // 3 browsers will scrape
        },
    };
    let keywords = ['New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Philadelphia',
    'Phoenix',
    'San Antonio',
    'San Diego',
    'Dallas',
    'San Jose',
    'Austin',
    'Indianapolis',
    'Jacksonville',
    'San Francisco',
    'Columbus',
    'Charlotte',
    'Fort Worth',
    'Detroit',
    'El Paso',
    'Memphis',
    'Seattle',
    'Denver',
    'Washington',
    'Boston',
    'Nashville-Davidson',
    'Baltimore',
    'Oklahoma City',
    'Louisville/Jefferson County',
    'Portland',
    'Las Vegas',
    'Milwaukee',
    'Albuquerque',
    'Tucson',
    'Fresno',
    'Sacramento',
    'Long Beach',
    'Kansas City',
    'Mesa',
    'Virginia Beach',
    'Atlanta',
    'Colorado Springs',
    'Omaha',
    'Raleigh',
    'Miami',
    'Oakland',
    'Minneapolis',
    'Tulsa',
    'Cleveland',
    'Wichita',
    'Arlington',
    'New Orleans',
    'Bakersfield',
    'Tampa',
    'Honolulu',
    'Aurora',
    'Anaheim',
    'Santa Ana',
    'St. Louis',
    'Riverside',
    'Corpus Christi',
    'Lexington-Fayette',
    'Pittsburgh',
    'Anchorage',
    'Stockton',
    'Cincinnati',
    'St. Paul',
    'Toledo',
    'Greensboro',
    'Newark',
    'Plano',
    'Henderson',
    'Lincoln',
    'Buffalo',
    'Jersey City',
    'Fort Wayne',
    'Orlando',
    'St. Petersburg',
    'Chandler',
    'Laredo',
    'Norfolk',
    'Durham',
    'Madison',
    'Lubbock',
    'Irvine',
    'Winston-Salem',
    'Glendale',
    'Garland',
    'Hialeah',
    'Reno',
    'Chesapeake',
    'Gilbert',
    'Baton Rouge',
    'Irving',
    'Scottsdale',
    'North Las Vegas',
    'Fremont',
    'Boise City',
    'Richmond',
    'San Bernardino',
    'Chula Vista'
    ];
    let scrape_job = {
        random_user_agent: true,
        search_engine: 'bing',
        output_file: 'bing.json',
        keywords: keywords,
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);


    await scraper.start(); 

    var results = await scraper.scrape(scrape_job);

    console.dir(results.metadata, {depth: null, colors: true});

    await scraper.quit();
})();
