'use strict';
const express = require('express');
const { createLogger, transports } = require('winston');
const http = require('http');
const https = require('https');
const assert = require('assert');
const path = require('path');
const keyCert = require('key-cert');
const Promise = require('bluebird');
const Proxy = require('http-mitm-proxy');

const debug = require('debug')('se-scraper:test');
const se_scraper = require('..');

const httpPort = 3012;
const httpsPort = httpPort + 1;
const proxyPort = httpPort + 2;

const fakeSearchEngine = express();
fakeSearchEngine.get('/search', (req, res) => {
    debug('q=%s', req.query.q);
    const pageNumber = ((req.query.start/10) || 0)  + 1;
    res.sendFile(path.join(__dirname, 'mocks/google/' + req.query.q + '_page' + pageNumber + '.html'));
});
fakeSearchEngine.use(express.static('test/mocks/google', {extensions: ['html']}));

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

    describe('keep_html_on_error', function(){

        const testLogger = createLogger({
            transports: [
                new transports.Console({
                    level: 'error'
                })
            ]
        });

        /**
         * Test html_output option
         */
        it('html_output single page single keyword', async function () {

            const scrape_job = {
                search_engine: 'google',
                /* TODO refactor start_url
                google_settings: {
                    start_url: 'http://localhost:' + httpPort
                },
                */
                keywords: ['test error'],
            };

            var scraper = new se_scraper.ScrapeManager({
                throw_on_detection: true,
                keep_html_on_error: true,
                logger: testLogger,
                //clean_html_output: false,
                //clean_data_images: false,
                // TODO refactor start_url so we can use-it instead of depending of the proxy for this test
                proxies: ['http://localhost:' + proxyPort],
                use_proxies_only: true,
                standard_timeout: 500,
            });
            await scraper.start();
            await assert.rejects(
                async () => {
                    await scraper.scrape(scrape_job);
                },
                (error) => {
                    assert(error.html_on_error, 'Error is containing the html output');
                    return /#fbar/.test(error.message);
                }
            )
            await scraper.quit();
            
        });

    });

});