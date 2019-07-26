const se_scraper = require('../index.js');
'use strict';
const express = require('express');

// Constants
const PORT = process.env.PORT;
const HOST = process.env.HOST;

// App
const app = express();
app.use(express.json());
let browser_config = {
    random_user_agent: true,
    headless : true,
    debug_level: 1,
    sleep_range: [1,2],
    use_proxies_only: true,
    puppeteer_cluster_config: {
        timeout: 30 * 60 * 1000, // max timeout set to 30 minutes
        monitor: false,
        concurrency: 1, // one scraper per tab
        maxConcurrency: 1, // scrape with 5 tabs
    }
};
app.post('/', async (req, res) => {
    // var scraper = new se_scraper.ScrapeManager(browser_config);
    // await scraper.start();
    // console.log('======================');

    // var results = await scraper.scrape(req.body);
    let results = await se_scraper.scrape(browser_config, req.body);

    console.dir(results, {depth: null, colors: true});
    
    res.send(results);

    //await scraper.quit();

});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);


