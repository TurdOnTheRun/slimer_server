var webpage = require('webpage');
var page = webpage.create();
var webserver = require("webserver").create();
var system = require('system');

var SLIMER_SERVER_ADDRESS = 'localhost:8083';

var SHOT_QUALITY = 0;
var FIRST_SHOT_TIME = 2200;
var FINAL_SHOT_TIME = 2500;

var MOBILE_SETTINGS = {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_1_4 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10B350 Safari/8536.25',
    width: 295,
    height: 597,
    clipHeight: 1500
};

var WEB_SETTINGS = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:10.0) Gecko/20100101 Firefox/50.0',
    width: 1366,
    height: 828,
    clipHeight: 1500
};

var SETTINGS;
var ready = true;

var firstShotTimeout;
var finalTimeout;

page.settings.resourceTimeout = 4000;
page.onError = function(msg){
    // system.stderr.writeLine(msg);
};
page.onConsoleMessage = function(msg, lineNum, sourceId){
    // system.stderr.writeLine( 'CONSOLE: ' + msg, lineNum, sourceId );
};

var getScreenshot = function(req, res){

    var renderSetup = function(callback){
        var clipHeight = SETTINGS.clipHeight;
        page.scrollPosition = {
            top: 0,
            left: 0
        };
        var dimensions = page.evaluate(function(){
            return [document.body.scrollHeight, document.body.scrollWidth];
        });
        if(dimensions[0] < clipHeight){
            clipHeight = dimensions[0];
        }
        page.clipRect = { top: 0, left: 0, width: dimensions[1], height: clipHeight };
        if(typeof(callback) === typeof(Function)){
            callback(clipHeight, dimensions[1]);
        }
    };
    
    var renderWebpage = function(finalRender, callback){
        renderSetup(function(height, width){
            page.render(req.data.fileLink, { format: 'png', quality: SHOT_QUALITY });
            res.write(JSON.stringify({ 'finalRender': finalRender, 'height': height, 'width': width }));
            res.close();
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
            renderWebpage(true, function(){
                page.close();
                ready = true;
            });
        }, FINAL_SHOT_TIME);
    };

    if(req.data.type && req.data.type === 'web'){
        SETTINGS = WEB_SETTINGS;
    }
    else{
        SETTINGS = MOBILE_SETTINGS;
    }

    page.settings.userAgent = SETTINGS.userAgent;
    page.viewportSize = { width: SETTINGS.width, height: SETTINGS.height };
    setFinalTimeout();
    // setFirstShotTimeout();

    page.open(req.data.url, function(status){
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

webserver.listen(8083, function(req, res) {
    if(req.headers.Host === SLIMER_SERVER_ADDRESS){
        var data;
        try{
            data = JSON.parse(req.queryString);
        }
        catch(e){
            res.close();
            return;
        }
        if(data.isReadyCheck){
            res.write(JSON.stringify({ isReady: ready }));
            res.close();
        }
        else if(ready && data.url && data.fileLink){
            ready = false;
            req.data = data;
            getScreenshot(req, res);
        }
    }
    else{
        req.close();
    }
});
