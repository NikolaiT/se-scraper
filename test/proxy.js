'use strict';
const express = require('express');
const { createLogger, transports } = require('winston');
const http = require('http');
const https = require('https');
const assert = require('assert');
const keyCert = require('key-cert');
const Promise = require('bluebird');
const Proxy = require('http-mitm-proxy');

const debug = require('debug')('se-scraper:test');
const se_scraper = require('../');
const Scraper = require('../src/modules/se_scraper');

const httpPort = 3012;
const httpsPort = httpPort + 1;
const proxyPort = httpPort + 2;

const fakeSearchEngine = express();
fakeSearchEngine.set('trust proxy', 'loopback');
fakeSearchEngine.get('/test-proxy', (req, res) => {
    debug('fake-search-engine req.hostname=%s', req.hostname);
    //debug('req to', req.socket.localAddress, req.socket.localPort);
    setTimeout(() => res.send(req.hostname), 100); // Add timeout here because raise condition for first test
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

    describe('proxies', function(){

        class MockScraperTestProxy extends Scraper {

            async load_start_page(){
                return true;
            }
            
            async search_keyword(){
                await this.page.goto('http://test.local:' + httpPort + '/test-proxy');
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
         * Jobs will be executed 2 by 2 through the proxy and direct connection
         * THIS TEST NEED TO HAVE test.local 127.0.0.1 in /etc/hosts because chrome bypass localhost even with proxy set
         */
        it('one proxy given, use_proxies_only=false', async function () {

            const scrape_job = {
                search_engine: MockScraperTestProxy,
                keywords: ['news', 'some stuff', 'i work too much', 'what to do?', 'javascript is hard'],
            };

            var scraper = new se_scraper.ScrapeManager({
                throw_on_detection: true,
                proxies: ['http://localhost:' + proxyPort],
                // default is use_proxies_only: false,
                logger: testLogger,
            });
            await scraper.start();

            const { results } = await scraper.scrape(scrape_job);
            assert.strictEqual(results['news']['1'], 'test.local');
            assert.strictEqual(results['some stuff']['1'], 'ProxiedThroughFakeEngine');
            assert.strictEqual(results['i work too much']['1'], 'test.local');
            assert.strictEqual(results['what to do?']['1'], 'ProxiedThroughFakeEngine');
            assert.strictEqual(results['javascript is hard']['1'], 'test.local');

            await scraper.quit();
        });

        /**
         * Jobs will be executed 1 by 1 through the proxy
         */
        it('one proxy given, use_proxies_only=true', async function () {

            const scrape_job = {
                search_engine: MockScraperTestProxy,
                keywords: ['news', 'some stuff', 'i work too much', 'what to do?', 'javascript is hard'],
            };

            var scraper = new se_scraper.ScrapeManager({
                throw_on_detection: true,
                proxies: ['http://localhost:' + proxyPort],
                use_proxies_only: true,
                logger: testLogger,
            });
            await scraper.start();

            const { results } = await scraper.scrape(scrape_job);
            assert.strictEqual(results['news']['1'], 'ProxiedThroughFakeEngine');
            assert.strictEqual(results['some stuff']['1'], 'ProxiedThroughFakeEngine');
            assert.strictEqual(results['i work too much']['1'], 'ProxiedThroughFakeEngine');
            assert.strictEqual(results['what to do?']['1'], 'ProxiedThroughFakeEngine');
            assert.strictEqual(results['javascript is hard']['1'], 'ProxiedThroughFakeEngine');

            await scraper.quit();
        });

        it('zero proxy given, use_proxies_only=true', async function () {

            const scrape_job = {
                search_engine: MockScraperTestProxy,
                keywords: ['news', 'some stuff', 'i work too much', 'what to do?', 'javascript is hard'],
            };

            await assert.rejects(async () => {
                var scraper = new se_scraper.ScrapeManager({
                    throw_on_detection: true,
                    use_proxies_only: true,
                    logger: testLogger,
                });
                await scraper.start();
                const { results } = await scraper.scrape(scrape_job);
                await scraper.quit();
            }, /Must provide at least one proxy in proxies if you enable use_proxies_only/);

        });

    });

});