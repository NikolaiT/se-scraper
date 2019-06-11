const se_scraper =  require('./../index.js');
var assert = require('chai').assert;

/*
 * Use chai and mocha for tests.
 * https://mochajs.org/#installation
 */

const normal_search_keywords = ['apple', 'rain'];

async function normal_image_search_test() {
    let config = {
        search_engine: 'google_image',
        compress: false,
        debug: false,
        verbose: false,
        keywords: normal_search_keywords,
        keyword_file: '',
        num_pages: 2,
        headless: true,
        output_file: '',
        block_assets: true,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        random_user_agent: false,
    };

    console.log('normal_image_search_test()');
    await se_scraper.scrape(config, normal_image_search_test_case);
}

// we test with a callback function to our handler
function normal_image_search_test_case(err, response) {

    if (err) {
        console.error(err);
    } else {
        assert.equal(response.metadata.num_requests, 2);

        for (let query in response.results) {

            let total_rank = 1;

            assert.containsAllKeys(response.results, normal_search_keywords, 'not all keywords were scraped.');

            for (let page_number in response.results[query]) {

                assert.isNumber(parseInt(page_number), 'page_number must be numeric');

                let obj = response.results[query][page_number];

                assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'effective_query'], 'not all keys are in the object');

                assert.isAtLeast(obj.results.length, 15, 'results must have at least 15 SERP objects');
                assert.equal(obj.no_results, false, 'no results should be false');
                assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

                for (let res of obj.results) {

                    assert.containsAllKeys(res, ['link', 'snippet', 'rank', 'clean_link'], 'not all keys are in the SERP object');

                    assert.isOk(res.link, 'link must be ok');
                    assert.typeOf(res.link, 'string', 'link must be string');
                    assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

                    assert.isOk(res.clean_link, 'clean_link must be ok');
                    assert.typeOf(res.clean_link, 'string', 'clean_link must be string');
                    assert.isAtLeast(res.clean_link.length, 5, 'clean_link must have at least 5 chars');

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
    await normal_image_search_test();
})();