const handler = require('./../src/node_scraper.js');
var assert = require('chai').assert;

/*
 * Use chai and mocha for tests.
 * https://mochajs.org/#installation
 */

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

const search_engines = ['google', 'google_image', 'google_news', 'youtube', 'bing', 'infospace', 'duckduckgo'];
const keywords = ['news', 'weather'];

async function tests() {
    event = {
        search_engine: 'google',
        compress: false,
        debug: false,
        verbose: false,
        keywords: keywords,
        keyword_file: '',
        num_pages: 1,
        headless: true,
        output_file: '',
        block_assets: true,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
        random_user_agent: false,
    };

	for (let se of search_engines) {
		console.log(`Testing ${se}...`);
		event.search_engine = se;
		await handler.handler(event, undefined, test_case);
	}
}

async function no_results_test() {

    const keywords = ['fgskl340abJAksk43a44dsflkjaQQuBBdfk'];

    event = {
        write_meta_data: 'true',
        compress: 'false',
        debug: 'false',
        verbose: 'false',
        keywords: keywords,
    };

    for (let se of search_engines) {
        console.log(`Testing ${se}...`);
        event.search_engine = se;
        await handler.handler(event, undefined, test_case_no_results);
        await sleep(3000);
    }
}

async function effective_query_test() {

    const keywords = ['mount evverrest'];

    event = {
        write_meta_data: true,
        job_name: 'test-job',
        search_engine: '',
        compress: false,
        debug: false,
        verbose: false,
        keywords: keywords,
    };

    const effective_query_engines = ['google', 'google_image', 'google_news', 'youtube', 'bing'];

    for (let se of search_engines) {
        console.log(`Testing ${se}...`);
        event.search_engine = se;
        await handler.handler(event, undefined, test_case_effective_query);
        await sleep(3000);
    }
}

// we test with a callback function to our handler
function test_case(err, response) {

	if (err) {
		console.error(err);
	} else {
        assert.equal(response.headers['Content-Type'], 'text/json', 'content type is not text/json');
        assert.equal(response.statusCode, 200, 'status code must be 200');

        let total_rank = 1;

        for (query in response.results) {

            assert.containsAllKeys(response.results, keywords, 'not all keywords were scraped.');

            for (page_number in response.results[query]) {

                assert.isNumber(parseInt(page_number), 'page_number must be numeric');

                let obj = response.results[query][page_number];

                assert.containsAllKeys(obj, ['results', 'time',], 'not all keys are in the object');

                // at least 6 results
                assert.isAtLeast(obj.results.length, 6, 'results must have at least 6 SERP objects');
                // TODO: fix this
                // assert.equal(obj.no_results, false, 'no results should be false');
                assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
                assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
                assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

                for (let res of obj.results) {

                    assert.containsAllKeys(res, ['link', 'title', 'rank'], 'not all keys are in the SERP object');

                    assert.isOk(res.link, 'link must be ok');
                    assert.typeOf(res.link, 'string', 'link must be string');
                    assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

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

// we test with a callback function to our handler
function test_case_no_results(err, response) {

    if (err) {
        console.error(err);
    } else {

        assert.equal(response.headers['Content-Type'], 'text/json', 'content type is not text/json');
        assert.equal(response.statusCode, 200, 'status code must be 200');

        results = response.results;

        for (kw in results) {

            assert.isTrue(results[kw].no_results, 'no_result should be true');

            assert.typeOf(results[kw].num_results, 'string', 'num_results must be a string');
            assert.isEmpty(results[kw].num_results, 'no results should be a empty string');

            assert.typeOf(Date.parse(results[kw].time), 'number', 'time should be a valid date');
        }
    }
}

// we test with a callback function to our handler
function test_case_effective_query(err, response) {

    if (err) {
        console.error(err);
    } else {

        assert.equal(response.headers['Content-Type'], 'text/json', 'content type is not text/json');
        assert.equal(response.statusCode, 200, 'status code must be 200');

        results = response.results;

        for (kw in results) {
            assert.isTrue(results[kw].no_results, 'no_result should be true');

            // effective query must be different to the original keyword
            assert.isOk(results[kw].effective_query, 'effective query must be ok');
            assert.isNotEmpty(results[kw].effective_query, 'effective query must be valid');

            assert(results[kw].effective_query !== keyword, 'effective query must be different from keyword');

            assert.typeOf(results[kw].num_results, 'string', 'num_results must be a string');
            assert.isEmpty(results[kw].num_results, 'no results should be a empty string');

            assert.typeOf(Date.parse(results[kw].time), 'number', 'time should be a valid date');
        }

        console.log('SUCCESS: all tests passed!');
    }
}


//effective_query_test();
tests();
//no_results_test();