const cheerio = require('cheerio');
const sfunctions = require('./functions.js');

module.exports = {
    scrape_duckduckgo_news_pup: scrape_duckduckgo_news_pup,
};

async function scrape_duckduckgo_news_pup(page, event, context, pluggable) {
    await page.goto('https://duckduckgo.com/?q=42&t=h_&iar=news&ia=news');

    try {
        await page.waitForSelector('input[name="q"]', { timeout: 5000 });
    } catch (e) {
        return results;
    }

    let keywords = event.keywords;
    var results = {};

    for (var i = 0; i < keywords.length; i++) {

        keyword = keywords[i];

        if (pluggable.before_keyword_scraped) {
            await pluggable.before_keyword_scraped({
                keyword: keyword,
                page: page,
                event: event,
                context: context,
            });
        }

        try {
            const input = await page.$('input[name="q"]');
            // overwrites last text in input
            await input.click({ clickCount: 3 });
            await sfunctions.sleep(150);
            await input.type(keyword);
            await sfunctions.sleep(150);
            await input.focus();
            await page.keyboard.press("Enter");

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

            // await page.waitForSelector('.result--news', { timeout: 5000 });
            await page.waitForSelector('.serp__results', { timeout: 5000 });

            await sfunctions.sleep(1500);

            if (event.debug === true && event.is_local === true) {
                await page.screenshot({path: `debug/${keyword}.png`});
            }
            let html = await page.content();
            results[keyword] = parse_duckduckgo_news_results(html, event.max_results);

        } catch (e) {
            console.error(`Problem with scraping ${keyword}: ${e}`);
            return results;
        }
    }
    return results;
}

function parse_duckduckgo_news_results(html) {
    // load the page source into cheerio
    const $ = cheerio.load(html);

    // perform queries
    const results = [];
    $('.result--news').each((i, link) => {
        results.push({
            link: $(link).find('.result__title .result__a').attr('href'),
            title: $(link).find('.result__title .result__a').text(),
            date: $(link).find('.result__timestamp').text(),
            snippet: $(link).find('.result__snippet').text(),
        });
    });

    const cleaned = [];
    for (var i=0; i < results.length; i++) {
        let res = results[i];
        if (res.link && res.link.trim() && res.title && res.title.trim()) {
            res.rank = i+1;
            cleaned.push(res);
        }
    }

    return {
        time: (new Date()).toUTCString(),
        results: cleaned
    }
}