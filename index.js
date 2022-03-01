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
    console.log('Method: ' + request.method);

    if (request.method === 'REGISTER') {
        // vytiahnem meno usera
        var user = sip.parseUri(request.headers.to.uri).user;
        // zapisem usera do db
        users[user] = request.headers.contact;

        // vytvorim response
        var response = sip.makeResponse(request, 200, 'Vsetko OK');
        response.headers.to.tag = Math.floor(Math.random() * 1e6);
        
        //console.log(response);
        proxy.send(response);
    } else {
        // vytiahnem meno usera
        var user = sip.parseUri(request.headers.to.uri).user;

        // zistim ci user existuje
        if(users[user] && Array.isArray(users[user]) && users[user].length > 0) {
            request.uri = users[user][0].uri;

            // potrebujem upravit port, v wiresharku bol zly a potom nechodilo BYE
            if(request.headers.contact) {
                request.headers.contact[0].uri = 'sip:' + sip.parseUri(request.headers.contact[0].uri).user + '@' + address + ':' + port.toString();
            }

            proxy.send(request, (response) => {
                // pri vlastnom custom callbacku treba tento shift
                response.headers.via.shift();

                if(response.headers.contact) {
                    response.headers.contact[0].uri = 'sip:' + sip.parseUri(response.headers.contact[0].uri).user + '@' + address + ':' + port.toString();
                }

                proxy.send(response);
            });
            
        } else {
            // user neexistuje
            var response = sip.makeResponse(request, 404, 'Nenasiel sa');

            proxy.send(response);
        }
    }

    console.log('----------------------------------------');
});