const se_scraper =  require('./../index.js');
const chai = require('chai');
chai.use(require('chai-string'));
const assert = chai.assert;

/*
 * Use chai and mocha for tests.
 * https://mochajs.org/#installation
 */

const normal_search_keywords = ['apple tree', 'weather tomorrow'];

async function normal_search_test() {
    let config = {
        compress: false,
        debug_level: 1,
        keyword_file: '',
        headless: true,
        output_file: '',
        block_assets: true,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        random_user_agent: false,
    };

    let scrape_config = {
        search_engine: 'google',
        keywords: normal_search_keywords,
        num_pages: 3,
    };

    console.log('normal_search_test()');
    normal_search_test_case( await se_scraper.scrape(config, scrape_config) );
}

// we test with a callback function to our handler
function normal_search_test_case(response) {
    assert.equal(response.metadata.num_requests, 6);

    for (let query in response.results) {
        let total_rank = 1;

        assert.containsAllKeys(response.results, normal_search_keywords, 'not all keywords were scraped.');

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query'], 'not all keys are in the object');

            assert.isAtLeast(obj.results.length, 7, 'results must have at least 8 SERP objects');
            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            for (let res of obj.results) {

                assert.containsAllKeys(res, ['link', 'title', 'rank', 'visible_link'], 'not all keys are in the SERP object');

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
                assert.equal(res.rank, total_rank++, 'rank ist wrong');
            }
        }
    }
}

const keywords_no_results = ['fgskl34440abJAksfs4353534a3l34AVGFDFflkjaQQuBBdfk',];

async function no_results_test() {
    let config = {
        compress: false,
        debug_level: 1,
        keyword_file: '',
        headless: true,
        output_file: '',
        block_assets: true,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        random_user_agent: false,
    };

    let scrape_config = {
        search_engine: 'google',
        keywords: keywords_no_results,
        num_pages: 1,
    };

    console.log('no_results_test()');
    test_case_no_results( await se_scraper.scrape(config, scrape_config) );
}

// we test with a callback function to our handler
function test_case_no_results(response) {
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

const effective_query_keywords = ['mount evverrest'];

async function effective_query_test() {
    let config = {
        compress: false,
        debug_level: 1,
        keyword_file: '',
        headless: true,
        output_file: '',
        block_assets: true,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        random_user_agent: false,
    };

    let scrape_config = {
        search_engine: 'google',
        keywords: effective_query_keywords,
        num_pages: 1,
    };

    console.log('effective_query_test()');
    test_case_effective_query( await se_scraper.scrape(config, scrape_config) );
}

// we test with a callback function to our handler
function test_case_effective_query(response) {
    assert.equal(response.metadata.num_requests, 1);

    for (let query in response.results) {

        assert.containsAllKeys(response.results, effective_query_keywords, 'not all keywords were scraped.');

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query'], 'not all keys are in the object');

            // effective query must be different to the original keyword
            assert.isOk(obj.effective_query, 'effective query must be ok');
            assert.isNotEmpty(obj.effective_query, 'effective query must be valid');
            assert(obj.effective_query !== query, 'effective query must be different from keyword');

            assert.isAtLeast(obj.results.length, 7, 'results must have at least 8 SERP objects');
            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');
        }
    }
}

async function html_output_query_test() {
    let config = {
        compress: false,
        debug_level: 1,
        keyword_file: '',
        headless: true,
        output_file: '',
        block_assets: true,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        random_user_agent: false,
    };

    let scrape_config = {
        search_engine: 'google',
        keywords: normal_search_keywords,
        num_pages: 3,
        html_output: true,
    };

    let output = await se_scraper.scrape(config, scrape_config);
    normal_search_test_case( output );
    check_html_output_test_case( output );
}

function check_html_output_test_case( response ) {
  for (let query in response.html_output) {

    assert.containsAllKeys(response.html_output, normal_search_keywords, 'not all keywords were scraped.');

    for (let page_number in response.html_output[query]) {
      assert.isNumber(parseInt(page_number), 'page_number must be numeric');
      assert.startsWith(response.html_output[query][page_number], '<!DOCTYPE html><html');
    }
  }
}

const ads_keywords = ['cloud services', 'auto kaufen'];

async function ads_test() {
    let config = {
        compress: false,
        debug_level: 1,
        headless: true,
        block_assets: false,
        random_user_agent: false, // dont try to trick google with ads
    };

    let scrape_config = {
        search_engine: 'google',
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

            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query', 'top_ads', 'bottom_ads', 'places'], 'not all keys are in the object');

            assert.isAtLeast(obj.results.length, 7, 'results must have at least 7 SERP objects');
            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            assert(obj.top_ads.length >= 1 || obj.bottom_ads.length >= 1, 'top_ads or bottom_ads must have at least 1 SERP object');

            for (let res of obj.top_ads) {

                assert.isOk(res.tracking_link, 'link must be ok');
                assert.typeOf(res.tracking_link, 'string', 'link must be string');
                assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

                assert.isOk(res.visible_link, 'link must be ok');
                assert.typeOf(res.visible_link, 'string', 'link must be string');
                assert.isAtLeast(res.visible_link.length, 5, 'link must have at least 5 chars');

                assert.isOk(res.link, 'visible_link must be ok');
                assert.typeOf(res.link, 'string', 'visible_link must be string');
                assert.isAtLeast(res.link.length, 5, 'visible_link must have at least 5 chars');

                assert.isOk(res.title, 'title must be ok');
                assert.typeOf(res.title, 'string', 'title must be string');
                assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

                assert.isOk(res.snippet, 'snippet must be ok');
                assert.typeOf(res.snippet, 'string', 'snippet must be string');
                assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');

                assert.typeOf(res.links, 'array', 'links must be array');
            }

            for (let res of obj.bottom_ads) {
                assert.isOk(res.tracking_link, 'link must be ok');
                assert.typeOf(res.tracking_link, 'string', 'link must be string');
                assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

                assert.isOk(res.visible_link, 'link must be ok');
                assert.typeOf(res.visible_link, 'string', 'link must be string');
                assert.isAtLeast(res.visible_link.length, 5, 'link must have at least 5 chars');

                assert.isOk(res.link, 'visible_link must be ok');
                assert.typeOf(res.link, 'string', 'visible_link must be string');
                assert.isAtLeast(res.link.length, 5, 'visible_link must have at least 5 chars');

                assert.isOk(res.title, 'title must be ok');
                assert.typeOf(res.title, 'string', 'title must be string');
                assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

                assert.isOk(res.snippet, 'snippet must be ok');
                assert.typeOf(res.snippet, 'string', 'snippet must be string');
                assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');

                assert.typeOf(res.links, 'array', 'links must be array');
            }

        }
    }
}



const product_keywords = ['autoreifen bmw'];

async function products_test() {
    let config = {
        compress: false,
        debug_level: 1,
        headless: true,
        block_assets: false,
        random_user_agent: false, // dont try to trick google with ads
    };

    let scrape_config = {
        search_engine: 'google',
        keywords: ads_keywords,
        num_pages: 1,
    };

    console.log('products_test()');
    test_case_products_test( await se_scraper.scrape(config, scrape_config) );
}

function test_case_products_test(response) {
    assert.equal(response.metadata.num_requests, 2);

    for (let query in response.results) {

        assert.containsAllKeys(response.results, ads_keywords, 'not all keywords were scraped.');

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query', 'top_ads', 'bottom_ads', 'places'], 'not all keys are in the object');

            assert.isAtLeast(obj.results.length, 7, 'results must have at least 7 SERP objects');
            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            assert(obj.top_products.length >= 1 || obj.right_products.length >= 1, 'top_products or right_products must have at least 1 SERP object');

            for (let res of obj.top_products) {

                assert.isOk(res.tracking_link, 'link must be ok');
                assert.typeOf(res.tracking_link, 'string', 'link must be string');
                assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

                assert.isOk(res.link, 'link must be ok');
                assert.typeOf(res.link, 'string', 'link must be string');
                assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

                assert.isOk(res.price, 'price must be ok');
                assert.typeOf(res.price, 'string', 'price must be string');
                assert.isAtLeast(res.price.length, 5, 'price must have at least 5 chars');

                assert.isOk(res.title, 'title must be ok');
                assert.typeOf(res.title, 'string', 'title must be string');
                assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

                assert.isOk(res.vendor_link, 'vendor_link must be ok');
                assert.typeOf(res.vendor_link, 'string', 'vendor_link must be string');
                assert.isAtLeast(res.vendor_link.length, 10, 'vendor_link must have at least 10 chars');
            }

            for (let res of obj.right_products) {
                assert.isOk(res.tracking_link, 'link must be ok');
                assert.typeOf(res.tracking_link, 'string', 'link must be string');
                assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

                assert.isOk(res.link, 'link must be ok');
                assert.typeOf(res.link, 'string', 'link must be string');
                assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

                assert.isOk(res.price, 'price must be ok');
                assert.typeOf(res.price, 'string', 'price must be string');
                assert.isAtLeast(res.price.length, 5, 'price must have at least 5 chars');

                assert.isOk(res.title, 'title must be ok');
                assert.typeOf(res.title, 'string', 'title must be string');
                assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

                assert.isOk(res.vendor_link, 'vendor_link must be ok');
                assert.typeOf(res.vendor_link, 'string', 'vendor_link must be string');
                assert.isAtLeast(res.vendor_link.length, 10, 'vendor_link must have at least 10 chars');
            }

        }
    }
}

describe('Google', function(){
  this.timeout(30000);
  it('normal search',  normal_search_test);
  it('no results', no_results_test);
  it('effective query', effective_query_test);
  it('html output query', html_output_query_test);
  it('ads', ads_test);
  it('products test', products_test);
});
