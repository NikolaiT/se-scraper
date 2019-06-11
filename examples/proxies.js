const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        debug_level: 1,
        output_file: 'examples/results/proxyresults.json',
        proxy_file: '/home/nikolai/.proxies', // one proxy per line
        log_ip_address: true,
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['news', 'scrapeulous.com', 'incolumitas.com', 'i work too much', 'what to do?', 'javascript is hard'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);
    await scraper.start();

    var results = await scraper.scrape(scrape_job);
    console.dir(results, {depth: null, colors: true});
    await scraper.quit();
})();
