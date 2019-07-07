const se_scraper =  require('./../index.js');
const chai = require('chai');
chai.use(require('chai-string'));
const assert = chai.assert;

const normal_search_keywords = ['apple tree', 'weather tomorrow'];

async function normal_search_test() {
    let config = {
        compress: false,
        debug_level: 1,
        headless: true,
        block_assets: false,
        random_user_agent: true,
    };

    let scrape_config = {
        search_engine: 'duckduckgo',
        keywords: normal_search_keywords,
        num_pages: 2,
    };

    console.log('normal_search_test()');
    normal_search_test_case( await se_scraper.scrape(config, scrape_config) );
}

// we test with a callback function to our handler
function normal_search_test_case(response) {
    assert.equal(response.metadata.num_requests, 2);

    for (let query in response.results) {
        let total_rank = 1;

        assert.containsAllKeys(response.results, normal_search_keywords, 'not all keywords were scraped.');

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.containsAllKeys(obj, ['results', 'time', 'effective_query'], 'not all keys are in the object');

            assert.isAtLeast(obj.results.length, 7, 'results must have at least 7 SERP objects');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

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
                assert.isAtLeast(res.title.length, 5, 'title must have at least 5 chars');

                assert.isOk(res.snippet, 'snippet must be ok');
                assert.typeOf(res.snippet, 'string', 'snippet must be string');
                assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');

                assert.isNumber(res.rank, 'rank must be integer');
                assert.equal(res.rank, total_rank++, 'rank ist wrong');
            }
        }
    }
}

const effective_query_keywords = ['mount everrest'];

async function effective_query_test() {
    let config = {
        compress: false,
        debug_level: 1,
        headless: true,
        block_assets: true,
        random_user_agent: true,
    };

    let scrape_config = {
        search_engine: 'duckduckgo',
        keywords: effective_query_keywords,
        num_pages: 1,
    };

    console.log('test_case_effective_query()');
    test_case_effective_query( await se_scraper.scrape(config, scrape_config) );
}

// we test with a callback function to our handler
function test_case_effective_query(response) {
    assert.equal(response.metadata.num_requests, 1);

    results = response.results;
    for (let query in response.results) {

        assert.containsAllKeys(response.results, effective_query_keywords, 'not all keywords were scraped.');

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.containsAllKeys(obj, ['results', 'time', 'effective_query'], 'not all keys are in the object');

            // effective query must be different to the original keyword
            assert.isOk(obj.effective_query, 'effective query must be ok');
            assert.isNotEmpty(obj.effective_query, 'effective query must be valid');
            assert(obj.effective_query !== query, 'effective query must be different from keyword');

            assert.isAtLeast(obj.results.length, 7, 'results must have at least 7 SERP objects');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');
        }
    }
}

const ads_keywords = ['cloud services', 'buy shoes'];

async function ads_test() {
    let config = {
        compress: false,
        debug_level: 1,
        headless: true,
        block_assets: false,
        random_user_agent: false,
    };

    let scrape_config = {
        search_engine: 'duckduckgo',
        keywords: ads_keywords,
        num_pages: 1,
    };

    console.log('ads_test()');
    test_case_ads_test( await se_scraper.scrape(config, scrape_config) );
}

function test_case_ads_test(response) {
    assert.equal(response.metadata.num_requests, 2);

    for (let query in response.results) {

        assert.containsAllKeys(response.results, ads_keywords, 'not all keywords were scraped.');

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.containsAllKeys(obj, ['results', 'time', 'effective_query', 'ads'], 'not all keys are in the object');

            assert.isAtLeast(obj.results.length, 6, 'results must have at least 6 SERP objects');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');
            assert.isAtLeast(obj.ads.length, 2, 'ads must have at least 2 SERP object');

            for (let res of obj.ads) {

                assert.isOk(res.tracking_link, 'link must be ok');
                assert.typeOf(res.tracking_link, 'string', 'link must be string');
                assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

                assert.isOk(res.visible_link, 'visible_link must be ok');
                assert.typeOf(res.visible_link, 'string', 'visible_link must be string');
                assert.isAtLeast(res.visible_link.length, 5, 'visible_link must have at least 5 chars');

                assert.isOk(res.title, 'title must be ok');
                assert.typeOf(res.title, 'string', 'title must be string');
                assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

                assert.isOk(res.snippet, 'snippet must be ok');
                assert.typeOf(res.snippet, 'string', 'snippet must be string');
                assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');
            }
        }
    }
}


describe('Duckduckgo', function(){
    this.timeout(30000);
    it('normal search',  normal_search_test);
    it('effective query', effective_query_test);
    it('finds ads', ads_test);
});