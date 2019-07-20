
    require('request-promise')({
            url: 'http://lumtest.com/myip.json',
            proxy: process.env.PROXY_URL,
            json: true
        }).then(function(data){ console.log(data); 
        console.log('-----------------')}, function(err){ console.error(err); });

        
        require('request-promise')({
            url: 'http://ipinfo.io/json',
            proxy: process.env.PROXY_URL,
            json: true
        }).then(function(data){ console.log(data); }, function(err){ console.error(err); });

    // require('request-promise')({
    //         url: 'https://geoip-db.com/json',
    //         proxy: process.env.PROXY_URL,
    //         json: true
    //     }).then(function(data){ console.log(data); }, function(err){ console.error(err); });