/**
 
 Test server with:

curl -XPOST http://0.0.0.0:3000 -H 'Content-Type: application/json' \
-d '{
    "browser_config": {
        "random_user_agent": true
    },
    "scrape_config": {
        "search_engine": "google",
        "keywords": ["test"],
        "num_pages": 1
    }
}'

*/

const se_scraper = require('../index.js');
'use strict';
const express = require('express');

// Constants
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// App
const app = express();
app.use(express.json());

let browser_config = {
    random_user_agent: true,
    headless : true,
    debug_level: 1,
    sleep_range: '',
    puppeteer_cluster_config: {
        timeout: 30 * 60 * 1000, // max timeout set to 30 minutes
        monitor: false,
        concurrency: 1, // one scraper per tab
        maxConcurrency: 1, // scrape with 5 tabs
    }
};

app.post('/', async (req, res) => {
    if (!req.body.browser_config || !req.body.scrape_config) {
        res.json({
            'status': 400,
            'msg': 'please specify browser_config and scrape_config'
        });
    } else {
        // overwrite standard browser config
        Object.assign(browser_config, req.body.browser_config);

        var scraper = new se_scraper.ScrapeManager(browser_config);
        await scraper.start();
        var results = await scraper.scrape(req.body.scrape_config);
        // console.dir(results, {depth: null, colors: true});
        await scraper.quit();
        
        res.send(results);
    }
});

app.listen(PORT, HOST);

console.log(`Running on http://${HOST}:${PORT}`);
