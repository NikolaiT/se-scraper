'use strict';
const express = require('express');
const puppeteer = require('puppeteer');
// TODO add a test logger in place of default winston logger
const logger = require('winston');
const net = require('net');
const http = require('http');
const https = require('https');
const url = require('url');
const assert = require('assert');
const path = require('path');
const keyCert = require('key-cert');
const Promise = require('bluebird');

const debug = require('debug')('se-scraper:test');
const se_scraper = require('../');
const Scraper = require('../src/modules/se_scraper');

const httpPort = 3012;
const httpsPort = httpPort + 1;
const httpOtherPort = httpPort + 2;

const fakeSearchEngine = express();
fakeSearchEngine.get('/test', (req, res) => {
    debug(req.ip, req.ips, req.protocol, req.hostname);
    debug(req.socket.localAddress, req.socket.localPort);
    res.send('OK');
});

describe('Config', function(){

    let httpServerAndProxy, httpsServer, httpOtherServer;
    before(async function(){
        // Here mount our fake engine in both http and https listen server
        httpServerAndProxy = http.createServer(fakeSearchEngine);
        httpsServer = https.createServer(await keyCert(), fakeSearchEngine);

        /**
         * express doesn't handle HTTP CONNECT method, this implement a basic MITM http proxy
         * here we use our http server to also act as a http proxy and rewrite all http/s request to our fake engine
         */
        httpServerAndProxy.on('connect', (req, clientSocket, head) => {
            const parsedUrl = url.parse('http://' + req.url);
            const destPort = (parseInt(parsedUrl.port) === 443) ? httpsPort : httpPort;
            const serverSocket = net.connect(destPort, 'localhost', () => {
                debug('connection proxied askedHost=%s toPort=%s', parsedUrl.host, destPort);
                clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');
                serverSocket.write(head);
                serverSocket.pipe(clientSocket);
                clientSocket.pipe(serverSocket);
                serverSocket.on('error', (err)=>{
                    console.error(err);
                });
            });
        });

        await Promise.promisify(httpServerAndProxy.listen, {context: httpServerAndProxy})(httpPort);
        await Promise.promisify(httpsServer.listen, {context: httpsServer})(httpsPort);
        debug('Fake http search engine servers started');
    });

    after(function(){
        httpsServer.close();
        httpServerAndProxy.close();
    });

    describe('proxies', function(){

        class MockScraper extends Scraper {

            async load_start_page(){
                return true;
            }
            
            async search_keyword(){
                await this.page.goto('http://void:' + httpPort + '/test');
            }

            async parse_async(){
                const bodyHandle = await this.page.$('body');
                return await this.page.evaluate(body => body.innerHTML, bodyHandle);
            }
        }

        /**
         * Jobs will be executed 1 by 1 through the proxy
         */
        it('one proxy given', async function () {

            const scrape_job = {
                search_engine: MockScraper,
                keywords: ['news', 'some stuff', 'i work too much', 'what to do?', 'javascript is hard'],
            };

            var scraper = new se_scraper.ScrapeManager({
                throw_on_detection: true,
                proxies: ['http://localhost:' + httpPort],
                use_proxies_only: true,
            });
            await scraper.start();

            const { results } = await scraper.scrape(scrape_job);
            assert.strictEqual(results['news']['1'], 'OK');
            assert.strictEqual(results['some stuff']['1'], 'OK');
            assert.strictEqual(results['i work too much']['1'], 'OK');
            assert.strictEqual(results['what to do?']['1'], 'OK');
            assert.strictEqual(results['javascript is hard']['1'], 'OK');

            await scraper.quit();
        });

    });

});