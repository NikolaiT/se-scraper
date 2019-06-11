const se_scraper = require('./src/node_scraper.js');

async function scrape(user_config, scrape_config) {

    var scraper = new se_scraper.ScrapeManager(user_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_config);

    await scraper.quit();

    return results;
}

module.exports = {
    scrape: scrape,
    ScrapeManager: se_scraper.ScrapeManager,
};
