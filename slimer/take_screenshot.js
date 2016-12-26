var webpage = require('webpage');
var system = require('system');
var fs = require('fs');

var time = new Date();

var openPage = function(url, fileLink, type){
    var page = webpage.create();
    var firstShotTimeout;
    var finalTimeout;

    var FIRST_SHOT_TIME = 2200;
    var FINAL_SHOT_TIME = 2400;

    var FILE_FORMAT = '.png';

    page.settings.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_1_4 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10B350 Safari/8536.25';
    var BROWSER_WIDTH = 295;
    var BROWSER_HEIGHT = 597;
    var CLIP_HEIGHT = 1500;
    var SHOT_QUALITY = 50;

    if(type && type === 'web'){
        page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:10.0) Gecko/20100101 Firefox/46.0';
        BROWSER_WIDTH = 1366;
        BROWSER_HEIGHT = 828;
        CLIP_HEIGHT = 1500;
    }

    var renderSetup = function(callback){
        var clipHeight = CLIP_HEIGHT;
        page.scrollPosition = {
            top: 0,
            left: 0
        };
        var dimensions = page.evaluate(function(){
            return [document.body.scrollHeight, document.body.scrollWidth];
        });

        if(dimensions[0] < CLIP_HEIGHT){
            clipHeight = dimensions[0];
        }
        page.clipRect = { top: 0, left: 0, width: dimensions[1], height: clipHeight };

        if(typeof(callback) === typeof(Function)){
            callback(clipHeight, dimensions[1]);
        }
    };

    var renderWebpage = function(finalRender, callback){
        renderSetup(function(height, width){
            page.render(fileLink, { format: 'png', quality: SHOT_QUALITY });
            system.stdout.write(JSON.stringify({ 'finalRender': finalRender, 'height': height, 'width': width }));
            if(typeof(callback) === typeof(Function)){
                callback();
            }
        });
    };

    var setFirstShotTimeout = function(){
        firstShotTimeout = setTimeout(function(){
            renderWebpage(false);
        }, FIRST_SHOT_TIME);
    };

    var setFinalTimeout = function(){
        finalTimeout = setTimeout(function(){
            renderWebpage(true, function(){ slimer.exit(); });
        }, FINAL_SHOT_TIME);
    };

    page.viewportSize = { width: BROWSER_WIDTH, height: BROWSER_HEIGHT };

    page.settings.resourceTimeout = 4000;

    page.onError = function(msg){
        system.stderr.writeLine(msg);
    };
    page.onConsoleMessage = function(msg, lineNum, sourceId){
        // system.stderr.writeLine( 'CONSOLE: ' + msg, lineNum, sourceId );
    };

    setFinalTimeout();
    //setFirstShotTimeout();

    page.open(url, function(status){
        if(status !== 'success'){
            //__ERROR__
            slimer.exit(1);
        }
        else{
            page.scrollPosition = {
                top: 500,
                left: 0
            };
        }
    });
};

if(system.args.length < 3){
    system.stderr.write("Failed to run render_webpage_mobile.js\nUsage: slimerjs render_webpage_mobile.js url fileLink (type)");
    slimer.exit(1);
}
else{
    openPage(system.args[1], system.args[2], system.args[3]);
}
