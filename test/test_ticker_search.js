'use strict';
const se_scraper =  require('./../index.js');
const assert = require('chai').assert;

/*
 * Use chai and mocha for tests.
 * https://mochajs.org/#installation
 */

const quote_search_keywords = ['MSFT', 'AAPL'];

async function reuters_search_test() {
    let config = {
        search_engine: 'reuters',
        compress: false,
        debug: false,
        verbose: false,
        keywords: quote_search_keywords,
        keyword_file: '',
        num_pages: 1,
        headless: true,
        output_file: '',
        block_assets: true,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        random_user_agent: false,
    };

    console.log('reuters_search_test()');
    await se_scraper.scrape(config, reuters_search_test_case);
}

// we test with a callback function to our handler
function reuters_search_test_case(err, response) {

    if (err) {
        console.error(err);
    } else {

        for (let query in response.results) {
            let total_rank = 1;
            assert.containsAllKeys(response.results, quote_search_keywords, 'not all keywords were scraped.');

            for (let page_number in response.results[query]) {

                assert.isNumber(parseInt(page_number), 'page_number must be numeric');

                let obj = response.results[query][page_number];

                assert.containsAllKeys(obj, ['results', 'time'], 'not all keys are in the object');

                assert.isAtLeast(obj.results.length, 7, 'results must have at least 7 SERP objects');
                assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

                for (let res of obj.results) {

                    assert.containsAllKeys(res, ['link', 'title', 'date', 'snippet'], 'not all keys are in the SERP object');

                    assert.isOk(res.link, 'link must be ok');
                    assert.typeOf(res.link, 'string', 'link must be string');
                    assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

                    assert.isOk(res.title, 'title must be ok');
                    assert.typeOf(res.title, 'string', 'title must be string');
                    assert.isAtLeast(res.title.length, 5, 'title must have at least 5 chars');

                    assert.isOk(res.snippet, 'snippet must be ok');
                    assert.typeOf(res.snippet, 'string', 'snippet must be string');
                    assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');

                    assert.isOk(res.date, 'date must be ok');
                    assert.typeOf(res.date, 'string', 'date must be string');
                    assert.isAtLeast(res.date.length, 5, 'date must have at least 5 chars');
                }
            }
        }
    }
}

async function cnbc_search_test() {
    let config = {
        search_engine: 'cnbc',
        compress: false,
        debug: false,
        verbose: false,
        keywords: quote_search_keywords,
        keyword_file: '',
        num_pages: 1,
        headless: true,
        output_file: '',
        block_assets: true,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        random_user_agent: false,
    };

    console.log('cnbc_search_test()');
    await se_scraper.scrape(config, cnbc_search_test_case);
}

// we test with a callback function to our handler
function cnbc_search_test_case(err, response) {

    if (err) {
        console.error(err);
    } else {

        for (let query in response.results) {
            let total_rank = 1;
            assert.containsAllKeys(response.results, quote_search_keywords, 'not all keywords were scraped.');

            for (let page_number in response.results[query]) {

                assert.isNumber(parseInt(page_number), 'page_number must be numeric');

                let obj = response.results[query][page_number];

                assert.containsAllKeys(obj, ['results', 'time'], 'not all keys are in the object');

                assert.isAtLeast(obj.results.length, 7, 'results must have at least 7 SERP objects');
                assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

                for (let res of obj.results) {

                    assert.containsAllKeys(res, ['link', 'title', 'date'], 'not all keys are in the SERP object');

                    assert.isOk(res.link, 'link must be ok');
                    assert.typeOf(res.link, 'string', 'link must be string');
                    assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

                    assert.isOk(res.title, 'title must be ok');
                    assert.typeOf(res.title, 'string', 'title must be string');
                    assert.isAtLeast(res.title.length, 5, 'title must have at least 5 chars');

                    assert.isOk(res.date, 'date must be ok');
                    assert.typeOf(res.date, 'string', 'date must be string');
                    assert.isAtLeast(res.date.length, 5, 'date must have at least 5 chars');
                }
            }
        }
    }
}

const marketwatch_search_keywords = ['MSFT'];

async function marketwatch_search_test() {
    let config = {
        search_engine: 'marketwatch',
        compress: false,
        debug: false,
        verbose: false,
        keywords: marketwatch_search_keywords,
        keyword_file: '',
        num_pages: 1,
        headless: true,
        output_file: '',
        block_assets: true,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        random_user_agent: false,
    };

    console.log('marketwatch_search_test()');
    await se_scraper.scrape(config, marketwatch_search_test_case);
}

// we test with a callback function to our handler
function marketwatch_search_test_case(err, response) {

    if (err) {
        console.error(err);
    } else {

        for (let query in response.results) {
            let total_rank = 1;
            assert.containsAllKeys(response.results, marketwatch_search_keywords, 'not all keywords were scraped.');

            for (let page_number in response.results[query]) {

                assert.isNumber(parseInt(page_number), 'page_number must be numeric');

                let obj = response.results[query][page_number];

                assert.containsAllKeys(obj, ['results', 'time'], 'not all keys are in the object');

                assert.isAtLeast(obj.results.length, 7, 'results must have at least 7 SERP objects');
                assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

                for (let res of obj.results) {

                    assert.containsAllKeys(res, ['link', 'title', 'date', 'author'], 'not all keys are in the SERP object');

                    assert.isOk(res.link, 'link must be ok');
                    assert.typeOf(res.link, 'string', 'link must be string');
                    assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

                    assert.isOk(res.title, 'title must be ok');
                    assert.typeOf(res.title, 'string', 'title must be string');
                    assert.isAtLeast(res.title.length, 5, 'title must have at least 5 chars');

                    assert.isOk(res.author, 'author must be ok');
                    assert.typeOf(res.author, 'string', 'author must be string');
                    assert.isAtLeast(res.author.length, 5, 'author must have at least 5 chars');

                    assert.isOk(res.date, 'date must be ok');
                    assert.typeOf(res.date, 'string', 'date must be string');
                    assert.isAtLeast(res.date.length, 5, 'date must have at least 5 chars');
                }
            }
        }
    }
}


describe('Ticker', function(){
    this.timeout(30000);
    it('Reuters search test', reuters_search_test);
    it('CNBC search test', cnbc_search_test);
    it('Marketwatch search test', marketwatch_search_test);
});