const se_scraper = require('./../index.js');

(async () => {
const Cluster = {
    CONCURRENCY_PAGE: 1, // shares cookies, etc.
    CONCURRENCY_CONTEXT: 2, // no cookie sharing (uses contexts)
    CONCURRENCY_BROWSER: 3, // no cookie sharing and individual processes (uses contexts)
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
    'Chula Vista',
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
    'San Bernardino'];

let config = {
    search_engine: 'bing',
    debug: false,
    verbose: true,
    keywords: keywords,
    proxies: ['http://0.0.0.0:55555',
        'http://0.0.0.0:55555',
        'http://0.0.0.0:55555',
        'http://0.0.0.0:55555'],
    num_pages: 1, // how many pages per keyword
    output_file: 'bing.json',
    log_ip_address: false,
    headless: false,
    puppeteer_cluster_config: {
        timeout: 10 * 60 * 1000, // max timeout set to 10 minutes
        monitor: false,
        concurrency: Cluster.CONCURRENCY_PAGE, // one scraper per tab
        maxConcurrency: 7, // scrape with 7 tabs
    }
};

let scrape_job = {
    random_user_agent: true,
    search_engine: 'bing',
    keywords: keywords,
    num_pages: 1,
};

let results = await se_scraper.scrape(config, scrape_job);

console.dir(results, {depth: null, colors: true});
})();