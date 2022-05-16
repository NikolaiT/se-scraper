const se_scraper = require('./src/node_scraper.js');
var Scraper = require('./src/modules/se_scraper');

async function scrape(browser_config, scrape_config) {

    // scrape config overwrites the browser_config
    Object.assign(browser_config, scrape_config);

    var scraper = new se_scraper.ScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_config);

    await scraper.quit();

    return results;
}

module.exports = {
    scrape: scrape,
    ScrapeManager: se_scraper.ScrapeManager,
    Scraper: Scraper,
};
