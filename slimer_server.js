var args = process.argv.splice(2);
var net = require('net');
var child = require('child_process');
var path = require('path');
var s3 = require('s3');

var start_slimer = 'start-slimerjs ' + path.join(__dirname, 'slimer', 'take_screenshot.js');
var start_slimer_OSX = 'slimerjs ' + path.join(__dirname, 'slimer', 'take_screenshot.js');
var kill_slimer = path.join(__dirname, 'bash_scripts', 'kill-slimerjs');

var parentServerHost;
var parentServerPort;

var killTimeout;
var KILL_SLIMER_TIME = 8000;

var socket = new net.Socket();

var S3_BUCKET_NAME = 'siteshots';
var client = s3.createClient({
    s3RetryDelay: 200, // this is the default 
    s3Options: {
        accessKeyId: 'AKIAIZR6THRT3SL3W7XQ',
        secretAccessKey: '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',
    },
});

var callSlimer = function(elem){

    var slimer = start_slimer_OSX + ' ' + ' \"' + elem.Url + '\"' + ' \"' + path.join(__dirname, elem.fileLink) + '\"';
    
    if(elem.type === 'web'){
        slimer += ' web';
    }

    var c = child.exec(slimer);

    c.stderr.on('data', function(data){
        // ___ERROR___
        console.log(data);
    });

    c.stdout.on('data', function(data){
        // Change back to just data when slimerJS is updated
        data = JSON.parse(data.trim());
        if(data.finalRender){
            var params = {
                localFile: path.join(__dirname, elem.fileLink),
             
                s3Params: {
                    Bucket: S3_BUCKET_NAME,
                    Key: elem.fileLink,
                    ACL: 'public-read',
                },
            };
            var uploader = client.uploadFile(params);
            uploader.on('error', function(err) {
                console.error("unable to upload:", err.stack);
            });
            uploader.on('end', function() {
            });
        }
    });

    c.on('exit', function(code){
        if(code !== 0){
            console.log('Failed to load ' + elem.Url);
            //___ERROR___
        }else{
            killSlimer();
        }
    });

    killTimeout = setTimeout(function(){
        killSlimer();
    }, KILL_SLIMER_TIME);

};

var killSlimer = function(){

    var c = child.exec(kill_slimer);
    c.on('exit', function(code){
        clearTimeout(killTimeout);
        checkServer();
    });

};

var checkServer = function(){
    sendServerReady();
};

var resetServer = function(){

};

var sendServerReady = function(){
    socket.write(JSON.stringify({
        ready: true
    }));
};

socket.on('data', function(data){
    try{
        data = JSON.parse(data);
    } catch(e){
        return;
    }
    if(data.Url && data.fileLink){
        callSlimer(data);
    }
});


if(args.length !== 2){
    console.log('Failed to run slimer_server.js\nUsage: node slimer_server.js parentServerHost parentServerPort');
    process.exit(1);
}
else{
    parentServerHost = args[0];
    parentServerPort = args[1];

    socket.connect(parentServerPort, parentServerHost, function(){
            console.log('Connected to server');
            sendServerReady();
    });
}


