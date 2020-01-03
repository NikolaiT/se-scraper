const express = require('express');
const puppeteer = require('puppeteer');
const logger = require('winston');
const net = require('net');
const http = require('http');
const https = require('https');
const url = require('url');
const keyCert = require('key-cert');
const Promise = require('bluebird');

const debug = require('debug')('se-scraper:test');
const { GoogleScraper } = require('../src/modules/google');

const httpPort = 3012;
const httpsPort = httpPort + 1;

const fakeSearchEngine = express();
fakeSearchEngine.get("/about", (req, res) => {
  res.status(500).send("This is the About page");
});
fakeSearchEngine.use(express.static('test/mocks/google', {extensions: ['html']}));

describe('Module Google', function(){

    let httpServerAndProxy, httpsServer;
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

    let browser;
    let page;
    beforeEach(async function(){
        debug('Start a new browser');
        browser = await puppeteer.launch({
            //dumpio: true,
            ignoreHTTPSErrors: true,
            args: [ '--proxy-server=http://localhost:' + httpPort ]
        });
        debug('Open a fresh page');
        page = await browser.newPage();
    });

    afterEach(async function(){
        await browser.close();
    });

    it('one keyword', function(){
        const googleScraper = new GoogleScraper({
            config: {
                search_engine_name: 'google',
                throw_on_detection: true,
                keywords: ['test keyword'],
                logger,
                scrape_from_file: '',
                google_settings: {
                    //start_url: 'http://www.google.com/'
                }
            }
        });
        googleScraper.STANDARD_TIMEOUT = 500;
        return googleScraper.run({page});
    });


});