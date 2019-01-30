const cheerio = require('cheerio');

module.exports = {
    scrape_yahoo_finance_pup: scrape_yahoo_finance_pup,
    scrape_bloomberg_finance_pup: scrape_bloomberg_finance_pup,
    scrape_reuters_finance_pup: scrape_reuters_finance_pup,
    scrape_cnbc_finance_pup: scrape_cnbc_finance_pup,
    scrape_marketwatch_finance_pup: scrape_marketwatch_finance_pup,
    not_implemented: undefined,
};

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function scrape_yahoo_finance_pup(page, event, context, pluggable) {
    var results = {};
    await page.goto('https://finance.yahoo.com/');

    for (var i = 0; i < 3; i++) {
        consent = await page.waitForSelector('[type="submit"]');
        await consent.click();
    }

    for (let keyword of event.keywords) {

        if (pluggable.before_keyword_scraped) {
            await pluggable.before_keyword_scraped({
                keyword: keyword,
                page: page,
                event: event,
                context: context,
            });
        }

        try {
            await page.goto(`https://finance.yahoo.com/quote/${keyword}/news?p=${keyword}`);

            await page.waitForSelector('#quote-header-info', { timeout: 8000 });

            if (event.debug === true && event.is_local === true) {
                await page.screenshot({path: `debug/${keyword}.png`});
            }

            await sleep(1000);

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

async function scrape_marketwatch_finance_pup(page, event, context, pluggable) {
    var results = {};
    for (let keyword of event.keywords) {
        if (pluggable.before_keyword_scraped) {
            await pluggable.before_keyword_scraped({
                keyword: keyword,
                page: page,
                event: event,
                context: context,
            });
        }
        try {
            await page.goto(`https://www.marketwatch.com/investing/stock/${keyword}`);
            await page.waitForSelector('.intraday__data', { timeout: 8000 });

            if (event.debug === true && event.is_local === true) {
                await page.screenshot({path: `debug/${keyword}.png`});
            }

            await sleep(500);

            let newsData = await page.evaluate(() => {
                let results = [];
                // get the hotel elements
                let items = document.querySelectorAll('.article__content');
                // get the hotel data
                items.forEach((newsitem) => {
                    let data = {};
                    try {
                        data.link = newsitem.querySelector('.article__headline a').getAttribute('href');
                        data.title = newsitem.querySelector('.article__headline a').innerText;
                        data.date = newsitem.querySelector('.article__timestamp').innerText;
                        data.author = newsitem.querySelector('.article__author').innerText;
                    }
                    catch (exception) {
                        console.error('Error parsing marketwatch data: ', exception);
                    }
                    results.push(data);
                });
                return results;
            });

            results[keyword] = {
                time: (new Date()).toUTCString(),
                results: newsData,
            }

        } catch (e) {
            console.error(`Problem with scraping ${keyword}: ${e}`);
        }
    }
    return results;
}


async function scrape_bloomberg_finance_pup(page, event, context, pluggable) {
    /*
        Bloomberg blocks after one request. what a shit hole.
     */
    var results = {};
    for (let keyword of event.keywords) {

        if (pluggable.before_keyword_scraped) {
            await pluggable.before_keyword_scraped({
                keyword: keyword,
                page: page,
                event: event,
                context: context,
            });
        }

        try {
            await page.goto(`https://www.bloomberg.com/quote/${keyword}:US`);
            await page.waitForSelector('.pseudoMainContent', { timeout: 8000 });

            if (event.debug === true && event.is_local === true) {
                await page.screenshot({path: `debug/${keyword}.png`});
            }

            await sleep(1000);

            let news_items = await page.$x('//*[starts-with(@class,"newsItem")]');
            for (let item of news_items) {
                let url = item.$$('a').then((link) => {
                    link.getProperty('href').then((anchor) => {
                        return anchor;
                    })
                });
            }

        } catch (e) {
            console.error(`Problem with scraping ${keyword}: ${e}`);
        }
    }
    return results;
}

async function scrape_reuters_finance_pup(page, event, context, pluggable) {
    var results = {};
    for (let keyword of event.keywords) {

        if (pluggable.before_keyword_scraped) {
            await pluggable.before_keyword_scraped({
                keyword: keyword,
                page: page,
                event: event,
                context: context,
            });
        }

        try {
            await page.goto(`https://www.reuters.com/finance/stocks/overview/${keyword}`);
            await page.waitForSelector('#sectionHeader', { timeout: 8000 });

            if (event.debug === true && event.is_local === true) {
                await page.screenshot({path: `debug/${keyword}.png`});
            }

            await sleep(500);

            let newsData = await page.evaluate(() => {
                let results = [];
                // get the hotel elements
                let items = document.querySelectorAll('div.feature');
                // get the hotel data
                items.forEach((newsitem) => {
                    let data = {};
                    try {
                        data.link = newsitem.querySelector('h2 a').getAttribute('href');
                        data.link = 'https://www.reuters.com' + data.link;
                        data.title = newsitem.querySelector('h2 a').innerText;
                        data.text = newsitem.querySelector('p').innerText;
                        data.date = newsitem.querySelector('.timestamp').innerText;
                    }
                    catch (exception) {
                        console.error('Error parsing reuters data: ', exception);
                    }
                    results.push(data);
                });
                return results;
            });

            results[keyword] = {
                time: (new Date()).toUTCString(),
                results: newsData,
            }

        } catch (e) {
            console.error(`Problem with scraping ${keyword}: ${e}`);
        }
    }
    return results;
}

async function scrape_cnbc_finance_pup(page, event, context, pluggable) {
    var results = {};
    for (let keyword of event.keywords) {

        if (pluggable.before_keyword_scraped) {
            await pluggable.before_keyword_scraped({
                keyword: keyword,
                page: page,
                event: event,
                context: context,
            });
        }

        try {
            await page.goto(`https://www.cnbc.com/quotes/?symbol=${keyword}&tab=news`);
            await page.waitForSelector('#quote_title_and_chart', { timeout: 8000 });

            if (event.debug === true && event.is_local === true) {
                await page.screenshot({path: `debug/${keyword}.png`});
            }

            await sleep(500);

            let newsData = await page.evaluate(() => {
                let results = [];
                // get the hotel elements
                let items = document.querySelectorAll('div.headline');
                // get the hotel data
                items.forEach((newsitem) => {
                    let data = {};
                    try {
                        data.link = newsitem.querySelector('a').getAttribute('href');
                        data.title = newsitem.querySelector('[ng-bind="asset.headline"]').innerText;
                        data.date = newsitem.querySelector('span.note').innerText;
                    }
                    catch (exception) {
                        console.error('Error parsing cnbc data: ', exception);
                    }
                    results.push(data);
                });
                return results;
            });

            results[keyword] = {
                time: (new Date()).toUTCString(),
                results: newsData,
            }

        } catch (e) {
            console.error(`Problem with scraping ${keyword}: ${e}`);
        }
    }
    return results;
}