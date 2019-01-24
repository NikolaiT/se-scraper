const cheerio = require('cheerio');
const sfunctions = require('./functions.js');

module.exports = {
    scrape_yahoo_finance_pup: scrape_yahoo_finance_pup,
};

async function scrape_yahoo_finance_pup(browser, event, context) {
    var results = {};
    const page = await browser.newPage();
    await page.goto('https://finance.yahoo.com/');

    for (var i = 0; i < 3; i++) {
        consent = await page.waitForSelector('[type="submit"]');
        await consent.click();
    }

    for (let keyword of event.keywords) {
        try {
            await page.goto(`https://finance.yahoo.com/quote/${keyword}/news?p=${keyword}`);

            await page.waitForSelector('#quote-header-info', { timeout: 8000 });

            if (event.debug === true && event.is_local === true) {
                await page.screenshot({path: `debug/${keyword}.png`});
            }

            await sfunctions.sleep(1000);

            let html = await page.content();
            results[keyword] = parse(html);

        } catch (e) {
            console.error(`Problem with scraping ${keyword}: ${e}`);
        }
    }

    return results;
}

function parse(html) {
    // load the page source into cheerio
    const $ = cheerio.load(html);

    const results = [];
    $('.js-stream-content .Cf').each((i, link) => {
        results.push({
            link: $(link).find('h3 a').attr('href'),
            title: $(link).find('h3').text(),
            snippet: $(link).find('p').text(),
        })
    });

    return {
        time: (new Date()).toUTCString(),
        results: results,
    }
}