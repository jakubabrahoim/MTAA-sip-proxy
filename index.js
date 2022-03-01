var sip = require('sip');
var proxy = require('sip/proxy');

var fs = require('fs');

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

function getTimeStamp() {
    var date = new Date();
    return '[' + date.getDate() + '.' + (date.getMonth() + 1) + ' - ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ']';
}

function addLog(message) {
    fs.appendFile('log.log', message, (error) => {
        if (error) console.log(error);
    });

    return;
}

function logRegister(request) {
    var message = getTimeStamp() + ' >> ' + request.method + ' ' + request.headers.from['uri'] + '\n';
    addLog(message);

    return;
}

function logRequest(request) {
    if(request.method == 'INVITE')
        var message = getTimeStamp() + ' >> ' + 'INVITE (Zvonenie) ' + request.headers.from['uri'] + ' --> ' + request.headers.to['uri'] + '\n';
    else if(request.method == 'ACK')
        var message = getTimeStamp() + ' >> ' + 'ACK (Zdvihnutie/Zacatie hovoru) ' + request.headers.from['uri'] + ' --> ' + request.headers.to['uri'] + '\n';
    else if(request.method == 'BYE')
        var message = getTimeStamp() + ' >> ' + 'BYE (Ukoncenie hovoru) ' + request.headers.from['uri'] + ' --> ' + request.headers.to['uri'] + '\n';
    else 
        return;

    addLog(message);

    return;
}

function logResponse(response) {
    if(response.status == '603')
        var message = getTimeStamp() + ' >> ' + 'Decline 603 (Odmietnutie) ' + response.headers.from['uri'] + ' --> ' + response.headers.to['uri'] + '\n';
    else if(response.status == '100')
        var message = getTimeStamp() + ' >> ' + 'Trying 100 ' + response.headers.from['uri'] + ' --> ' + response.headers.to['uri'] + '\n';
    else if(response.status == '180')
        var message = getTimeStamp() + ' >> ' + 'Ringing 180 (Zvonenie) ' + response.headers.from['uri'] + ' --> ' + response.headers.to['uri'] + '\n';
    else if(response.status == '486')
        var message = getTimeStamp() + ' >> ' + 'Busy 486 (Obsadeny)' + response.headers.from['uri'] + ' --> ' + response.headers.to['uri'] + '\n';
    else
        return;

    addLog(message);

    return;
}

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
        
        logRegister(request);

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

            logRequest(request);

            proxy.send(request, (response) => {
                // pri vlastnom custom callbacku treba tento shift -> odstani prvy header
                response.headers.via.shift();

                if(response.headers.contact) {
                    response.headers.contact[0].uri = 'sip:' + sip.parseUri(response.headers.contact[0].uri).user + '@' + address + ':' + port.toString();
                }

                logResponse(response);

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

