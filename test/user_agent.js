'use strict';
const express = require('express');
const { createLogger, transports } = require('winston');
const http = require('http');
const https = require('https');
const assert = require('assert');
const keyCert = require('key-cert');
const Promise = require('bluebird');
const Proxy = require('http-mitm-proxy');
const UAParser = require('ua-parser-js');
const _ = require('lodash');

const debug = require('debug')('se-scraper:test');
const se_scraper = require('../');
const Scraper = require('../src/modules/se_scraper');

const httpPort = 3012;
const httpsPort = httpPort + 1;
const proxyPort = httpPort + 2;

const fakeSearchEngine = express();
fakeSearchEngine.set('trust proxy', 'loopback');
fakeSearchEngine.get('/test-user_agent', (req, res) => {
    debug('fake-search-engine req.headers.user-agent=%s', req.headers['user-agent']);
    res.send(req.headers['user-agent']);
});

describe('Config', function(){

    let httpServer, httpsServer, proxy;
    before(async function(){
        // Here mount our fake engine in both http and https listen server
        httpServer = http.createServer(fakeSearchEngine);
        httpsServer = https.createServer(await keyCert(), fakeSearchEngine);
       
        proxy = Proxy();
        proxy.onRequest((ctx, callback) => {
            ctx.proxyToServerRequestOptions.host = 'localhost';
            ctx.proxyToServerRequestOptions.port = (ctx.isSSL) ? httpsPort : httpPort;
            ctx.proxyToServerRequestOptions.headers['X-Forwarded-Host'] = 'ProxiedThroughFakeEngine';
            debug('Proxy request to %s', ctx.clientToProxyRequest.headers.host);
            return callback();
        });

        await Promise.promisify(proxy.listen, {context: proxy})({port: proxyPort});
        await Promise.promisify(httpServer.listen, {context: httpServer})(httpPort);
        await Promise.promisify(httpsServer.listen, {context: httpsServer})(httpsPort);
        debug('Fake http search engine servers started');
    });

    after(function(){
        httpsServer.close();
        httpServer.close();
        proxy.close();
    });

    describe('user_agent', function(){

        class MockScraperTestUserAgent extends Scraper {

            async load_start_page(){
                return true;
            }
            
            async search_keyword(){
                await this.page.goto('http://localhost:' + httpPort + '/test-user_agent');
            }

            async parse_async(){
                const bodyHandle = await this.page.$('body');
                return await this.page.evaluate(body => body.innerHTML, bodyHandle);
            }
        }

        const testLogger = createLogger({
            transports: [
                new transports.Console({
                    level: 'error'
                })
            ]
        });

        /**
         * Test user_agent option
         */
        it('fixed user_agent', async function () {

            const scrape_job = {
                search_engine: MockScraperTestUserAgent,
                keywords: ['javascript is hard'],
            };

            var scraper = new se_scraper.ScrapeManager({
                throw_on_detection: true,
                logger: testLogger,
                user_agent: 'THIS IS A USERAGENT 42.0'
            });
            await scraper.start();

            const { results } = await scraper.scrape(scrape_job);
            assert.strictEqual(results['javascript is hard']['1'], 'THIS IS A USERAGENT 42.0');

            await scraper.quit();
        });

        /**
         * Test random_user_agent option
         * TODO generated user_agent should be different for each keyword
         * TODO this test will sometimes fail because user_agent not very random :-(
         */
        it('random_user_agent', async function () {

            const scrape_job = {
                search_engine: MockScraperTestUserAgent,
                keywords: ['news'],
            };

            const NUMBER_OF_EXEC = 10;

            const uaList = await Promise.map(_.range(NUMBER_OF_EXEC), async (i) => {
                const scraper = new se_scraper.ScrapeManager({
                    throw_on_detection: true,
                    logger: testLogger,
                    random_user_agent: true,
                });
                await scraper.start();
                const { results: { news } } = await scraper.scrape(scrape_job);
                await scraper.quit();
                return news['1'];
            });
            
            uaList.forEach((userAgent) => {
                const uaParsed = UAParser(userAgent);
                assert(uaParsed.browser.name, 'UserAgent should have a browser name detected');
                assert(uaParsed.os.name, 'UserAgent should have a os name detected');
            });

            assert( _.chain(uaList).countBy().toPairs().sortBy(e => e[1]).last().value()[1] < (NUMBER_OF_EXEC * 0.4), 'Each user agent should appear less than 40% of the time' );
            
        });

    });

});