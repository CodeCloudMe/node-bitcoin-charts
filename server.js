#!/bin/env node
//  OpenShift sample Node application





var express = require('express');
var fs      = require('fs');

var pusher = require('pusher-client');
var MongoClient = require('mongodb').MongoClient;
var rp = require('request-promise');


var connection_string = '127.0.0.1:27017/prices';
// if OPENSHIFT env variables are present, use the available connection info:
if( process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}

var globalDB;

MongoClient.connect('mongodb://'+connection_string, function(err, db) {

   
    globalDB=db;
    

})



/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };

        self.routes['/getLatest'] = function(req, res) {
           // res.setHeader('Content-Type', 'application/json');
           
            globalDB.collection('bitstamp').find({'timestamp':{'$gt':0}}).toArray( 
                function(err, data){

                   // var respData = JSON.stringify(data);
                    console.log(data);
                    console.log('finishing');
                     res.send(data);

                });
           
        };




        self.routes['/getAllData'] = function(req, res){

            if(!req.query.exchange){
                res.send('{"status":"fail", "reason":"send exchange"}');

                return false;
            }
           var  exchange = req.query.exchange;

            

                 globalDB.collection(exchange).find({'timestamp':{'$gt':0}}).toArray( 
                    function(err, data){


                           if(exchange == "bter"){
                                
                                for(i in data){

                                    data[i]['price']= data[i]['last'];
                                }



                           } 


                           if(exchange == "bitstamp"){
                                
                                for(i in data){
                                    if(!data[i]['bid']){

                                        data.splice(i, 1);
                                    }
                                    else{
                                         data[i]['buy']= data[i]['bid'];
                                    }
                                   
                                }



                           } 

                           if(exchange == "bitfinex"){
                                
                                for(i in data){

                                    data[i]['buy']= data[i]['bid'];
                                }



                           } 

                           if(exchange =="btcchina"){


                                  for(i in data){
                                    var time1 = data[i]['timestamp'];
                                    data[i]= data[i]['ticker'];
                                    data[i]['timestamp']= time1;

                                }

                           }

                            if(exchange =="okcoin"){


                                  for(i in data){
                                    var time1 = data[i]['timestamp'];
                                    data[i]= data[i]['ticker'];
                                    data[i]['timestamp']= time1;

                                }

                           }
                           
                            if(exchange =="btc"){
                                 for(i in data){
                                     var time1 = data[i]['timestamp'];
                                    data[i]= data[i]['btc_usd'];
                                    data[i]['timestamp']= time1;
                                }

                           }


                             console.log(data);
                             console.log('finishing');
                             res.send(data);
                             return true;


                    });
         
            
        }

        self.routes['/getAllPrices'] = function(req, res) {




            var endPoints = [
                    'http://data.bter.com/api/1/ticker/btc_usd', 
                   'https://data.btcchina.com/data/ticker',
                    'https://btc-e.com/api/3/ticker/btc_usd',
                    'https://www.okcoin.com/api/ticker.do?ok=1',
                    'https://api.bitfinex.com/v1/pubticker/BTCUSD',
                    'https://www.bitstamp.net/api/ticker/'];




            var saveData = function(collectionName, data){


                console.log('saving into ' + collectionName + 'the followin \n \n '+data);
                 data = JSON.parse(data);

                 var timestamp = new Date().getTime(); 
                 data["timestamp"] = timestamp;


                 globalDB.collection(collectionName).insert(data);


                // globalDB.collection(database).insert( values ,
            }

            var allCollection = [];

         
            baseCommand = 'rp(theUrl)';
            addonCommand ='';
            for(i in endPoints ){


                var theUrl = endPoints[i]; 
               
                var collectn = theUrl.replace(/((data\.)|(api\.))/, '').match(/((:\/\/[^ww])|(www\.))\w+/)[0].replace('://', '').replace('www.', '');

              

               // rp(theUrl).then(function(data){saveData})
               if(i ==0){

                baseCommand = 'rp("'+theUrl+'")';
                addOnCommand = '.then(function(data){ saveData("'+collectn+'", data)})';
               }

               else{
                    addOnCommand = '.then(function(){rp("'+theUrl+'").then(function(data){  saveData("'+collectn+'", data)})})'
               }

                baseCommand = baseCommand + addOnCommand;
            }

            console.log(baseCommand);
            eval(baseCommand);

            res.send("success. Good job. Got data");

           // rp(theUrl).then(function(data){saveData("bter", data)}).then(function(data){saveData("btc", data)}).then(function(data){saveData("okcoin", data)}).then(function(data){saveData("bitfinex", data)}).then(function(data){saveData("bitstamp", data)})

           // eval(baseCommand);





        }



         self.routes['/prices'] = function(req, res) {
                
                res.setHeader('Content-Type', 'text/html');
        



                var p= new pusher('de504dc5763aeef9ff52');
                var trades_channel = p.subscribe('live_trades');
               

                console.log('running... waiting for trade');
                trades_channel.bind('trade', function(data) {
                    
                   
                        var id = data['id'];
                        var amount = data['amount'];
                        var price = data['price'];
                        var timestamp = new Date().getTime();
                       // var ask = data['ask'];
                       // var bid = data['bid'];
                       // var high = data['high'];
                       // var low = data['low'];
                       // var volume = data['volume'];





                        console.log(price);

                        var values = {'amount':amount, 'price':price, 'timestamp':timestamp};

                        console.log(values);
                       
                        globalDB.collection('bitstamp').insert( values ,function(err, records){
                                 if(err) { 
                                    console.log('write error: '+err);
                                
                                  }


                              //console.log(saveArr);
                                console.log('data saved');


                        })
                  
                 });




        };


    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express.createServer();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */


var zapp = new SampleApp();
zapp.initialize();
zapp.start();

