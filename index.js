var sip = require('sip');
var proxy = require('sip/proxy');

var os = require('os');
var interfaces = os.networkInterfaces();
var wifiIp = interfaces['WiFi'][1].address;

console.log('----------------------------------------');
console.log('Domain IP: ' + wifiIp);
console.log('----------------------------------------');

const port = 5060;
const address = wifiIp;

// "db" pouzivatelov
var users = {};

proxy.start({port: port, address: address}, (request) => {
    console.log('Incoming from: ' + request.headers.from['uri']);
    console.log('Method: ' + request.method + '\n');

    console.log(request.status);

    if (request.method === 'REGISTER') {
        // vytiahnem meno usera
        var user = sip.parseUri(request.headers.to.uri).user;
        // zapisem usera do db
        users[user] = request.headers.contact;

        // vytvorim response
        var response = sip.makeResponse(request, 200, 'OK');
        response.headers.to.tag = Math.floor(Math.random() * 1e6);
        
        proxy.send(response);
    } else {
        // vytiahnem meno usera
        var user = sip.parseUri(request.headers.to.uri).user;

        // zistim ci user existuje
        if(users[user] && Array.isArray(users[user]) && users[user].length > 0) {
            request.uri = users[user][0].uri;
            
            // proxy posiela 100 Trying
            var response = sip.makeResponse(request, 100, 'Trying');

            proxy.send(response);
            proxy.send(request);
        } else {
            // user neexistuje
            var response = sip.makeResponse(request, 404, 'Not Found');

            proxy.send(response);
        }
    }

    console.log(users);
    console.log('----------------------------------------');
});