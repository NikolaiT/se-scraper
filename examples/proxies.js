const se_scraper = require('./../src/node_scraper.js');

(async () => {
    let browser_config = {
        output_file: 'examples/results/proxyresults.json',
        log_ip_address: true,
        // a file with one proxy per line. Example:
        // socks5://78.94.172.42:1080
        // http://118.174.233.10:48400
        proxy_file: '/home/nikolai/.proxies', // one proxy per line
        // whether to use proxies only
        // when this is set to true, se-scraper will not use
        // your default IP address in a browser
        use_proxies_only: true,
    };

    let scrape_job = {
        search_engine: 'google',
        keywords: ['news', 'some stuff', 'i work too much', 'what to do?', 'javascript is hard'],
        num_pages: 1,
    };

    var scraper = new se_scraper.ScrapeManager(browser_config);
    await scraper.start();

    var results = await scraper.scrape(scrape_job);
    console.dir(results, {depth: null, colors: true});
    await scraper.quit();
})();
