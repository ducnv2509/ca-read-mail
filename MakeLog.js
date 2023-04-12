import myLogger from "../winstonLog/winston.js";

export function makeInfo(req,res,next) {
    let requestedTime = Date.now();
    req.requestedTime = requestedTime;
    let {method, body, url} = req;
    myLogger.info("%o",{method, body, url},{label:'REQUEST'});
    next();
}
export function logRequest(req) {
    let responseTime = Date.now();

    let {method, body, url,requestedTime,savedParams,action,savedQueries} = req;
    // let {deviceinfo} = req.headers;
    let fromServiceCode = req.headers['from-servicecode'];
    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    // let deviceInfo = undefined;
    // if(deviceinfo) {
    //     try {
    //         let buff = new Buffer.from(deviceinfo, 'base64');
    //         deviceInfo = JSON.parse(buff.toString('ascii'));
    //     }catch(e) {
    //         myLogger.info('ERROR:%o',e,{label:'logRequest'});
    //     }
    // }
    // if(deviceinfo === undefined) {
    //     let parser = new UAParser();
    //     parser.setUA(req.headers['user-agent']);
    //     let {browser,engine,os,device,cpu} = parser.getResult();
    //     deviceInfo = {browser,engine,os,device,cpu};
    // }else {

    // }
    let processingTime = responseTime - requestedTime;
    let dataLog = {url, ipAddr,method,body,requestedTime,responseTime,url,
    savedParams,action,processingTime,savedQueries,fromServiceCode,ServiceCode:"SOC"};
    Object.keys(dataLog).map((key) => {
        if(dataLog[key] === undefined) {
            delete dataLog[key];
        }
    });
}