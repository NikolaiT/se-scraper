const se_scraper =  require('./../index.js');
var assert = require('chai').assert;

const normal_search_keywords = ['apple juice'];

async function queryargs_search_test() {
    let config = {
        search_engine: 'google',
        compress: false,
        debug: true,
        verbose: true,
        keywords: normal_search_keywords,
        keyword_file: '',
        num_pages: 2,
        headless: true,
        output_file: '',
        block_assets: true,
        // use specific search engine parameters for various search engines
        google_settings: {
            google_domain: 'google.com',
            gl: 'fr', // The gl parameter determines the Google country to use for the query.
            hl: 'fr', // The hl parameter determines the Google UI language to return results.
            start: 30, // Determines the results offset to use, defaults to 0.
            num: 100, // Determines the number of results to show, defaults to 10. Maximum is 100.
        },
    };

    console.log('queryargs_search_test()');
    await se_scraper.scrape(config, queryargs_search_test_case);
}

// we test with a callback function to our handler
function queryargs_search_test_case(err, response) {

    if (err) {
        console.error(err);
    } else {
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

                assert.isAtLeast(obj.results.length, 90, 'results must have at least 80 SERP objects');
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
}

(async () => {
    await queryargs_search_test();
})();
