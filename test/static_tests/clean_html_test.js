const se_scraper =  require('./../../index.js');
const chai = require('chai');
chai.use(require('chai-string'));
const assert = chai.assert;
const path = require('path');
const cheerio = require('cheerio');


async function test_html_output() {
    let config = {
        debug_level: 1,
        headless: true,
        html_output: true,
        // whether to strip JS and CSS from the html_output
        // has only an effect if `html_output` is true
        clean_html_output: true,
        // remove all data images from the html
        clean_data_images: true,
        // test compression
        compress: false,
    };

    let scrape_config = {
        search_engine: 'bing',
        keywords: ['kaffeemaschine kaufen'],
        num_pages: 1,
        scrape_from_file: 'file://' + path.join(__dirname, './html/bing.html'),
    };

    var scraper = new se_scraper.ScrapeManager(config);

    await scraper.start();

    var response = await scraper.scrape(scrape_config);

    scrape_config.clean_html_output = false;
    scrape_config.clean_data_images = false;

    var response_no_cleaned = await scraper.scrape(scrape_config);

    test(response, response_no_cleaned, 'bing');

    scrape_config.search_engine = 'google';
    scrape_config.keywords =  ['rückspiegel schwarz'];
    scrape_config.scrape_from_file =  'file://' + path.join(__dirname, './html/google.html');
    scrape_config.clean_html_output = true;
    scrape_config.clean_data_images = true;

    var responseGoogle = await scraper.scrape(scrape_config);

    scrape_config.clean_html_output = false;
    scrape_config.clean_data_images = false;

    var response_no_cleanedGoogle = await scraper.scrape(scrape_config);

    test(responseGoogle, response_no_cleanedGoogle, 'google');


    scrape_config.keywords =  ['cloud services'];
    scrape_config.scrape_from_file =  'file://' + path.join(__dirname, './html/googleLarge.html');
    scrape_config.clean_html_output = true;
    scrape_config.clean_data_images = true;

    var responseGoogle = await scraper.scrape(scrape_config);

    scrape_config.clean_html_output = false;
    scrape_config.clean_data_images = false;

    var response_no_cleanedGoogle = await scraper.scrape(scrape_config);

    test(responseGoogle, response_no_cleanedGoogle, 'google');

    await scraper.quit();
}

function test(response, response_no_cleaned, se='google') {
    for (let query in response.results) {
        for (let page_number in response.results[query]) {
            let obj = response.results[query][page_number];
            let obj_no_cleaned = response_no_cleaned.results[query][page_number];

            console.log('html length of no cleaned SERP: ' + obj_no_cleaned.html.length);
            console.log('html length of cleaned SERP: ' + obj.html.length);

            assert.isOk(obj.html, 'Html must be ok!');
            assert.isAtLeast(obj.html.length, 100, 'html must be a length string');

            assert.isOk(obj_no_cleaned.html, 'Html must be ok!');
            assert.isAtLeast(obj_no_cleaned.html.length, 100, 'html must be a length string');

            assert.isBelow(obj.html.length, obj_no_cleaned.html.length, 'cleaned html must be smaller');

            // test that we can parse the html of both the cleaned and no cleaned versions
            // with cheerio and that serp results are roughly the same

            const cleaned$ = cheerio.load(obj.html);
            const no_cleaned$ = cheerio.load(obj_no_cleaned.html);

            var resCleaned = parseResults(cleaned$, se);
            var resNoCleaned = parseResults(no_cleaned$, se);

            assert.equal(resCleaned.length, resNoCleaned.length);
            assert.equal(resCleaned.length, obj.results.length);
            assert.equal(resNoCleaned.length, obj.results.length);

            // unset the rank
            resCleaned = resCleaned.map((el) => el.rank = undefined);
            resNoCleaned = resNoCleaned.map((el) => el.rank = undefined);
            obj.results = obj.results.map((el) => el.rank = undefined);

            assert.deepEqual(resCleaned, resNoCleaned, 'parsed results should be equal, even if html is cleaned');
            assert.deepEqual(resCleaned, obj.results, 'parsed results from cleaned html should be equal to se-scraper results');
            assert.deepEqual(resNoCleaned, obj.results, 'parsed results from non-cleaned html should be equal to se-scraper results');
        }
    }
}


function parseResults(s$, se) {

    var results = [];

    if (se === 'google') {
        s$('#center_col .g').each((i, link) => {
            results.push({
                link: s$(link).find('.r a').attr('href'),
                title: s$(link).find('.r a').text(),
                snippet: s$(link).find('span.st').text(),
                visible_link: s$(link).find('.r cite').text(),
                date: s$(link).find('span.f').text() || '',
            })
        });

    } else if (se === 'bing') {
        s$('#b_content #b_results .b_algo').each((i, link) => {
            results.push({
                link: s$(link).find('h2 a').attr('href'),
                title: s$(link).find('h2').text(),
                snippet: s$(link).find('.b_caption p').text(),
                visible_link: s$(link).find('cite').text(),
            })
        });
    } else {
        throw "no such search engine";
    }

    results = clean_results(results, ['title', 'link', 'snippet']);
    return results;
}

function clean_results(results, attributes) {
    const cleaned = [];
    var rank = 1;
    for (var res of results) {
        let goodboy = true;
        for (var attr of attributes) {
            if (!res[attr] || !res[attr].trim()) {
                goodboy = false;
                break;
            }
        }
        if (goodboy) {
            res.rank = rank++;
            cleaned.push(res);
        }
    }
    return cleaned;
}

describe('html output', function(){
    this.timeout(15000);
    it('static html output test',  test_html_output);
});