const se_scraper = require('./index.js');
'use strict';
const express = require('express');

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

// App
const app = express();
app.use(express.json());
app.post('/', (req, res) => {
    se_scraper.scrape(req.body, (err, response) =>{
        if (err) { console.error(err) }
        //console.log(req.body)
    
        /* response object has the following properties:
    
            response.results - json object with the scraping results
            response.metadata - json object with metadata information
            response.statusCode - status code of the scraping process
         */
    
        console.dir(response.results, {depth: null, colors: true});
       res.send(response.results)
    });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);


