const se_scraper =  require('./../../index.js');
const chai = require('chai');
chai.use(require('chai-string'));
const assert = chai.assert;
const path = require('path');

async function bing_ads() {
    let config = {
        compress: false,
        debug_level: 1,
        headless: true,
    };

    let scrape_config = {
        search_engine: 'bing',
        keywords: ['kaffeemaschine kaufen'],
        num_pages: 1,
        scrape_from_file: 'file://' + path.join(__dirname, './html/bing.html'),
    };

    var scraper = new se_scraper.ScrapeManager(config);

    await scraper.start();

    bing_search_with_ads( await scraper.scrape(scrape_config) );

    scrape_config.keywords = ['best cloud services'];
    scrape_config.scrape_from_file = 'file://' + path.join(__dirname, './html/bing2.html');

    bing_search_with_ads2( await scraper.scrape(scrape_config) );

    scrape_config.keywords = ['car tires cheap'];
    scrape_config.scrape_from_file = 'file://' + path.join(__dirname, './html/bing3.html');

    bing_search_with_ads3( await scraper.scrape(scrape_config) );

    scrape_config.keywords = ['service auto garage'];
    scrape_config.scrape_from_file = 'file://' + path.join(__dirname, './html/bing4.html');

    bing_search_with_ads4( await scraper.scrape(scrape_config) );

    await scraper.quit();
}

// we test with a callback function to our handler
function bing_search_with_ads(response) {
    assert.equal(response.metadata.num_requests, 1);

    for (let query in response.results) {

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.include(obj.num_results, '1’100’000', 'num results not included');
            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query', 'ads'], 'not all keys are in the object');
            assert.isAtLeast(obj.results.length, 6, 'results must have at least 6 SERP objects');
            assert.isAtLeast(obj.ads.length, 7, 'there are 7 ads');

            assert.isAtLeast(obj.right_side_ads.length, 5, 'there are 5 ads');

            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            confirm_results_ok(obj);
        }
    }
}


function bing_search_with_ads2(response) {
    assert.equal(response.metadata.num_requests, 1);

    for (let query in response.results) {

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.include(obj.num_results, '44’300’000', 'num results not included');
            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query', 'ads'], 'not all keys are in the object');
            assert.isAtLeast(obj.results.length, 6, 'results must have at least 6 SERP objects');
            assert.isAtLeast(obj.ads.length, 7, 'there are 7 ads');

            assert.isAtLeast(obj.right_side_ads.length, 5, 'there are 5 ads');

            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            confirm_results_ok(obj);
        }
    }
}

function bing_search_with_ads3(response) {
    assert.equal(response.metadata.num_requests, 1);

    for (let query in response.results) {

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.include(obj.num_results, '65.500.000 Results', 'num results not included');
            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query', 'ads'], 'not all keys are in the object');
            assert.isAtLeast(obj.results.length, 10, 'results must have at least 10 SERP objects');
            assert.isAtLeast(obj.ads.length, 3, 'there are 3 ads');

            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            confirm_results_ok(obj);
        }
    }
}

function bing_search_with_ads4(response) {
    assert.equal(response.metadata.num_requests, 1);

    for (let query in response.results) {

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.include(obj.num_results, '4.200.000 Ergebnisse', 'num results not included');
            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query', 'ads'], 'not all keys are in the object');
            assert.isAtLeast(obj.results.length, 9, 'results must have at least 9 SERP objects');
            assert.isAtLeast(obj.ads.length, 3, 'there are 3 ads');

            assert.equal(obj.no_results, false, 'no results should be false');
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
        assert.isAtLeast(res.title.length, 8, 'title must have at least 8 chars');

        assert.isOk(res.snippet, 'snippet must be ok');
        assert.typeOf(res.snippet, 'string', 'snippet must be string');
        assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');

        assert.isNumber(res.rank, 'rank must be integer');
    }

    for (let res of obj.ads) {

        assert.isOk(res.tracking_link, 'link must be ok');
        assert.typeOf(res.tracking_link, 'string', 'link must be string');
        assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.visible_link, 'link must be ok');
        assert.typeOf(res.visible_link, 'string', 'link must be string');
        assert.isAtLeast(res.visible_link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.title, 'title must be ok');
        assert.typeOf(res.title, 'string', 'title must be string');
        assert.isAtLeast(res.title.length, 8, 'title must have at least 8 chars');

        assert.isOk(res.snippet, 'snippet must be ok');
        assert.typeOf(res.snippet, 'string', 'snippet must be string');
        assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');
    }

    for (let res of obj.right_side_ads) {

        assert.isOk(res.tracking_link, 'link must be ok');
        assert.typeOf(res.tracking_link, 'string', 'link must be string');
        assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.visible_link, 'link must be ok');
        assert.typeOf(res.visible_link, 'string', 'link must be string');
        assert.isAtLeast(res.visible_link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.title, 'title must be ok');
        assert.typeOf(res.title, 'string', 'title must be string');
        assert.isAtLeast(res.title.length, 8, 'title must have at least 8 chars');

        assert.isOk(res.snippet, 'snippet must be ok');
        assert.typeOf(res.snippet, 'string', 'snippet must be string');
        assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');
    }
}

describe('Bing', function(){
    this.timeout(15000);
    it('static bing searches with ads',  bing_ads);
});