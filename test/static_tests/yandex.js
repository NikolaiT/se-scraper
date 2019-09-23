const se_scraper =  require('./../../index.js');
const chai = require('chai');
chai.use(require('chai-string'));
const assert = chai.assert;
const path = require('path');

async function yandex_ads() {
    let config = {
        compress: false,
        debug_level: 1,
        headless: true,
    };

    let scrape_config = {
        search_engine: 'yandex',
        keywords: ['cloud service'],
        num_pages: 1,
        scrape_from_file: 'file://' + path.join(__dirname, './html/yandex1.html'),
    };

    var scraper = new se_scraper.ScrapeManager(config);

    await scraper.start();

    yandex_search_with_ads( await scraper.scrape(scrape_config) );

    scrape_config.keywords = ['car tires cheap'];
    scrape_config.scrape_from_file = 'file://' + path.join(__dirname, './html/yandex2.html');

    yandex_search_with_ads2( await scraper.scrape(scrape_config) );

    await scraper.quit();
}

// we test with a callback function to our handler
function yandex_search_with_ads(response) {
    assert.equal(response.metadata.num_requests, 1);

    for (let query in response.results) {

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.include(obj.num_results, '2 million results', 'num results not included');
            assert.containsAllKeys(obj, ['results', 'time', 'num_results',], 'not all keys are in the object');
            assert.isAtLeast(obj.results.length, 12, 'results must have at least 12 SERP objects');

            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            confirm_results_ok(obj);
        }
    }
}


function yandex_search_with_ads2(response) {
    assert.equal(response.metadata.num_requests, 1);

    for (let query in response.results) {

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.include(obj.num_results, '5 million results', 'num results not included');
            assert.containsAllKeys(obj, ['results', 'time', 'num_results',], 'not all keys are in the object');
            assert.isAtLeast(obj.results.length, 11, 'results must have at least 12 SERP objects');

            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            confirm_results_ok(obj);
        }
    }
}


function confirm_results_ok(obj) {

    for (let res of obj.results) {
        assert.containsAllKeys(res, ['link', 'title', 'rank', 'visible_link', 'snippet'], 'not all keys are in the SERP object');

        assert.isOk(res.link, 'link must be ok');
        assert.typeOf(res.link, 'string', 'link must be string');
        assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.visible_link, 'visible_link must be ok');
        assert.typeOf(res.visible_link, 'string', 'visible_link must be string');
        assert.isAtLeast(res.visible_link.length, 5, 'visible_link must have at least 5 chars');

        assert.isOk(res.title, 'title must be ok');
        assert.typeOf(res.title, 'string', 'title must be string');
        assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

        assert.isOk(res.snippet, 'snippet must be ok');
        assert.typeOf(res.snippet, 'string', 'snippet must be string');
        assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');

        assert.isNumber(res.rank, 'rank must be integer');
    }
}

describe('Yandex', function(){
    this.timeout(10000);
    it('static yandex searches with ads',  yandex_ads);
});