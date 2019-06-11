const se_scraper =  require('./../index.js');
var assert = require('chai').assert;

/*
 * Use chai and mocha for tests.
 * https://mochajs.org/#installation
 */

const normal_search_keywords = ['iphone', 'clock'];

async function normal_search_test() {
    let config = {
        compress: false,
        keyword_file: '',
        headless: true,
        output_file: '',
        block_assets: true,
        random_user_agent: false,
    };

    let scrape_config = {
        search_engine: 'amazon',
        num_pages: 1,
        keywords: normal_search_keywords,
    };

    console.log('normal_search_test()');
    normal_search_test_case( await se_scraper.scrape(config, scrape_config) );
}

// we test with a callback function to our handler
function normal_search_test_case(response) {
    assert.equal(response.headers['Content-Type'], 'text/json', 'content type is not text/json');
    assert.equal(response.statusCode, 200, 'status code must be 200');
    assert.equal(response.metadata.num_requests, 2);

    for (let query in response.results) {
        let total_rank = 1;
        assert.containsAllKeys(response.results, normal_search_keywords, 'not all keywords were scraped.');

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query'], 'not all keys are in the object');

            assert.isAtLeast(obj.results.length, 7, 'results must have at least 7 SERP objects');
            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            for (let res of obj.results) {

                assert.containsAllKeys(res, ['link', 'title', 'rank', 'image', 'seller', 'stars', 'num_reviews', 'price', 'oldprice'], 'not all keys are in the SERP object');

                assert.isOk(res.link, 'link must be ok');
                assert.typeOf(res.link, 'string', 'link must be string');
                assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

                assert.isOk(res.title, 'title must be ok');
                assert.typeOf(res.title, 'string', 'title must be string');
                assert.isAtLeast(res.title.length, 5, 'title must have at least 5 chars');

                assert.isOk(res.seller, 'seller must be ok');
                assert.typeOf(res.seller, 'string', 'seller must be string');
                assert.isAtLeast(res.seller.length, 5, 'seller must have at least 10 chars');

                assert.isOk(res.stars, 'stars be ok');
                assert.typeOf(res.stars, 'string', 'stars must be string');
                assert.isAtLeast(res.stars.length, 5, 'stars must have at least 6 chars');
                assert.include(res.stars, ' out of ', 'stars must include " out of "');

                assert.isOk(res.num_reviews, 'num_reviews be ok');
                assert.typeOf(res.num_reviews, 'string', 'num_reviews must be string');
                assert.isAtLeast(res.num_reviews.length, 1, 'num_reviews must have at least 1 chars');

                assert.isOk(res.price, 'price be ok');
                assert.typeOf(res.price, 'string', 'price must be string');
                assert.isAtLeast(res.price.length, 5, 'price must have at least 5 chars');

                assert.isNumber(res.rank, 'rank must be integer');
                assert.equal(res.rank, total_rank++, 'rank ist wrong');
            }
        }
    }
}

const keywords_no_results = ['2342kljp;fj9834u40abJ54634344023safkl34a44dsflkjaQQuBBdfk',];

async function no_results_test() {
    let config = {
        compress: false,
        debug_level: 1,
        keyword_file: '',
        headless: true,
        output_file: '',
        block_assets: true,
        random_user_agent: false,
    };

    let scrape_config = {
        search_engine: 'amazon',
        num_pages: 1,
        keywords: keywords_no_results,
    };

    console.log('no_results_test()');
    test_case_no_results( await se_scraper.scrape(config, scrape_config) );
}

// we test with a callback function to our handler
function test_case_no_results(response) {
    assert.equal(response.headers['Content-Type'], 'text/json', 'content type is not text/json');
    assert.equal(response.statusCode, 200, 'status code must be 200');
    assert.equal(response.metadata.num_requests, 1);

    results = response.results;
    for (let query in response.results) {

        assert.containsAllKeys(response.results, keywords_no_results, 'not all keywords were scraped.');

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query'], 'not all keys are in the object');

            assert(obj.results.length === 0, 'results must have 0 SERP objects');
            assert.equal(obj.no_results, true, 'no results should be true');
            assert.isEmpty(obj.num_results, 'no results should be a empty string');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');
        }
    }
}

(async () => {
    await normal_search_test();
    await no_results_test();
})();