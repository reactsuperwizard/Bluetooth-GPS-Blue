// /*
//  * Licensed to the Apache Software Foundation (ASF) under one
//  * or more contributor license agreements.  See the NOTICE file
//  * distributed with this work for additional information
//  * regarding copyright ownership.  The ASF licenses this file
//  * to you under the Apache License, Version 2.0 (the
//  * "License"); you may not use this file except in compliance
//  * with the License.  You may obtain a copy of the License at
//  *
//  * http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing,
//  * software distributed under the License is distributed on an
//  * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
//  * KIND, either express or implied.  See the License for the
//  * specific language governing permissions and limitations
//  * under the License.
//  */
// var app = {
//     // Application Constructor
//     initialize: function() {
//         this.bindEvents();
//     },
//     // Bind Event Listeners
//     //
//     // Bind any events that are required on startup. Common events are:
//     // 'load', 'deviceready', 'offline', and 'online'.
//     bindEvents: function() {
//         document.addEventListener('deviceready', this.onDeviceReady, false);
//     },
//     // deviceready Event Handler
//     //
//     // The scope of 'this' is the event. In order to call the 'receivedEvent'
//     // function, we must explicitly call 'app.receivedEvent(...);'
//     onDeviceReady: function() {
//         app.receivedEvent('deviceready');
//     },
//     // Update DOM on a Received Event
//     receivedEvent: function(id) {
//         var parentElement = document.getElementById(id);
//         var listeningElement = parentElement.querySelector('.listening');
//         var receivedElement = parentElement.querySelector('.received');

//         listeningElement.setAttribute('style', 'display:none;');
//         receivedElement.setAttribute('style', 'display:block;');

//         console.log('Received Event: ' + id);
//     }
// };

// app.initialize();


/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var development = true;
var service = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
var characteristic = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
var mac = "24:0A:C4:1D:5B:06";
var btscantime = 3000;
var incomingMessage = "";
var data;

var radioGPS = 30;
var minRSSItosendopen = -90; //Valor a partir del cual mandamos aperturas para valores mayores.
var openingRequested = false;
var xc, yc, xp, yp; //variables para la posición
var situations = {
    in: 1,
    out: 2
}
var currentSituation;
var watchID;
var no_attempts_toconnect_toBLE_ifinarea = 1;
var currentAttempt_toconnect_toBLE_ifinarea = 0;


function setOrigin() {

    var element = document.getElementById('oriCoordinates');
    element.innerHTML = 'Ori Lat: ' + yp + ' - Ori Lon: ' + xp;

    xc = xp;
    yc = yp;

    fileManager.writeFile(JSON.stringify([xp, yp]));

};

Number.prototype.toRad = function () {
    return this * Math.PI / 180;
};

function haversineDistance(gps2, gps1) {

    var lat2 = gps2[1] //43.331110; 
    var lon2 = gps2[0]; //-1.809821; 
    var lat1 = gps1[1] //43.331111; 
    var lon1 = gps1[0] //-1.809740; 

    var R = 6371; // km 
    //has a problem with the .toRad() method below.
    var x1 = lat2 - lat1;
    var dLat = x1.toRad();
    var x2 = lon2 - lon1;
    var dLon = x2.toRad();
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    //Utils.print('Haversine distance: ' + d*1000)

    return (d * 1000);



    //var xp=2;
    //var yp=2;
    //var xc=0;
    //var yc=0;

    //document.getElementById("demo").innerHTML = Math.sqrt(Math.pow(Math.abs(xp-xc),2) + Math.pow(Math.abs(yp-yc),2));
};

function startPositioning() {

    Utils.print("Starting positioning...")

    var onGPSSuccess = function (position) {

        var element = document.getElementById('curCoordinates');
        element.innerHTML = 'Cur Lat: ' + position.coords.latitude + ' - Cur Lon: ' + position.coords.longitude + " - " + "Acc: " + position.coords.accuracy.toFixed(2);

        /*console.log('Latitude: ' + position.coords.latitude + '\n' +
            'Longitude: ' + position.coords.longitude + '\n' +
            'Altitude: ' + position.coords.altitude + '\n' +
            'Accuracy: ' + position.coords.accuracy + '\n' +
            'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
            'Heading: ' + position.coords.heading + '\n' +
            'Speed: ' + position.coords.speed + '\n' +
            'Timestamp: ' + position.timestamp + '\n');*/

        xp = position.coords.longitude;
        yp = position.coords.latitude;

        cordova.fireDocumentEvent('GPS_read', position);

    };

    var onGPSError = function (error) {

        Utils.print("GPS Error code " + error.code + " - " + error.message);

    };

    //Utilizar navigator.geolocation.getCurrentPosition DA ERROR TRAS UNAS LECTURAS!
    watchID = navigator.geolocation.watchPosition(onGPSSuccess, onGPSError, {
        maximumAge: 3000,
        timeout: 4500,
        enableHighAccuracy: true
    });
};

function stopPositioning() {
    Utils.print("Stopping positioning...") /
        navigator.geolocation.clearWatch(watchID);

};


var app = {

    // Application Constructor
    initialize: function () {

        //document.addEventListener('init', this.onInit.bind(this), false);
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);      
      

        document.addEventListener('GPS_read', this.onGPS_read.bind(this), false);

        document.addEventListener('readFile', this.onreadFile.bind(this), false);
        document.addEventListener('writeFile', this.onwriteFile.bind(this), false);
        document.addEventListener('removeFile', this.onremoveFile.bind(this), false);

        document.addEventListener('ble_enable', this.onBle_enable.bind(this), false);
        document.addEventListener('ble_scan_completed', this.onBle_scan_completed.bind(this), false);
        document.addEventListener('ble_connect', this.onBle_connect.bind(this), false);
        document.addEventListener('ble_autoconnect', this.onBle_autoconnect.bind(this), false);
        document.addEventListener('ble_write', this.onBle_write.bind(this), false);
        document.addEventListener('ble_disconnect', this.onBle_disconnect.bind(this), false);
        document.addEventListener('ble_received', this.onBle_received.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    // onInit: function (event) {
    //     this.receivedEvent('init', event);
    // },

    onDeviceReady: function (event) {		
		cordova.plugins.autoStart.enable(); 
        this.receivedEvent('deviceready', event);
    },

    onBackbutton: function (event) {
        this.receivedEvent('backbutton', event);
    },

    onGPS_read: function (position) {
        this.receivedEvent('GPS_read', position);
    },

    onreadFile: function (params) {
        this.receivedEvent('readFile', params);
    },

    onwriteFile: function (params) {
        this.receivedEvent('writeFile', params);
    },

    onremoveFile: function (params) {
        this.receivedEvent('removeFile', params);
    },

    onBle_enable: function (params) {
        this.receivedEvent('ble_enable', params);
    },

    onBle_scan_completed: function (params) {
        this.receivedEvent('ble_scan_completed', params);
    },

    onBle_connect: function (params) {
        this.receivedEvent('ble_connect', params);
    },

    onBle_autoconnect: function (params) {
        this.receivedEvent('ble_autoconnect', params);
    },

    onBle_disconnect: function (params) {
        this.receivedEvent('ble_disconnect', params);
    },

    onBle_received: function (params) {
        this.receivedEvent('ble_received', params);
    },

    onBle_write: function (params) {
        this.receivedEvent('ble_write', params);
    },

    // Update DOM on a Received Event
    receivedEvent: function (id, params) {
		 
        //Utils.print('<font color="red">Received Event: ' + id + " - " + JSON.stringify(params) + "</font>");
        if (params != undefined) res = JSON.parse(JSON.stringify(params));

        if (id == "deviceready") {
            
			 var onSuccess = function (position) {
				 
    };
 
    // onError Callback receives a PositionError object
    //
    function onError(error) {
        alert('code: ' + error.code + '\n' +
            'message: ' + error.message + '\n');
    }

    cordova.plugins.autoStart.enable();

    navigator.geolocation.getCurrentPosition(onSuccess, onError);

    cordova.plugins.diagnostic.isBluetoothAvailable(function (available) {
        
        if (available == true) {

        }
        else {
            if (window.cordova && window.cordova.plugins.settings) {
               
                console.log('openNativeSettingsTest is active');
                window.cordova.plugins.settings.open("bluetooth", function () {
                    console.log('opened settings');
                },
                    function () {
                        console.log('failed to open settings');
                    }
                );
            } else {
                console.log('openNativeSettingsTest is not active!');
            }
        }
        console.log("Bluetooth is " + (available ? "available" : "not available"));

    }, function (error) {
        console.error("The following error occurred: " + error);
    });



    cordova.plugins.diagnostic.isLocationAvailable(function (available) {

        if (available == true) {

        }
        else {
            if (window.cordova && window.cordova.plugins.settings) {
                
                console.log('openNativeSettingsTest is active');
                window.cordova.plugins.settings.open("location", function () {
                    console.log('opened settings');
                },
                    function () {
                        console.log('failed to open settings');
                    }
                );
            } else {
                console.log('openNativeSettingsTest is not active!');
            }
        }
    }, function (error) {
        console.error("The following error occurred: " + error);
    });
           
		  

		   // cordova.plugins.diagnostic.isDeviceRooted(function(rooted){
			   // alert(rooted);
			   // if (rooted == true) {
				// cordova.plugins.backgroundMode.moveToBackground();
        // }
			 
		// }, function(error){
			// console.error("The following error occurred: "+error);
		// });
		   
		  
			//1
            // cordova.plugins.backgroundMode.on('deactivate', function(){
            //     Utils.print("deactivate\n");
            // });
            
			//cordova.plugins.autoStart.enable();
            document.getElementById("cmdOrigin").addEventListener("click", setOrigin);
            document.getElementById("incradGPS").addEventListener("click", function () {
                if (radioGPS < 100) radioGPS++;
                document.getElementById("radGPS").innerHTML = radioGPS;
            });
            document.getElementById("decradGPS").addEventListener("click", function () {
                if (radioGPS > 1) radioGPS--;
                document.getElementById("radGPS").innerHTML = radioGPS;
            });
            document.getElementById("incbleRSSI").addEventListener("click", function () {
                if (minRSSItosendopen < -10) minRSSItosendopen++;
                document.getElementById("bleRSSI").innerHTML = minRSSItosendopen;
            });
            document.getElementById("decbleRSSI").addEventListener("click", function () {
                if (minRSSItosendopen > -180) minRSSItosendopen--;
                document.getElementById("bleRSSI").innerHTML = minRSSItosendopen;
            });


            fileManager.readFile(); //Intentamos obtener las coordenadas de posicionamiento origen
            Utils.print("Device ready completed!");

           
            cordova.plugins.backgroundMode.enable();
         
                    
            cordova.plugins.backgroundMode.setDefaults({ silent: true });

           //document.addEventListener("backbutton", this.onBackbutton.bind(this), false);

            cordova.plugins.backgroundMode.on('activate', function() {
                cordova.plugins.backgroundMode.disableWebViewOptimizations(); 
            });
          
		     //cordova.plugins.backgroundMode.moveToBackground();
			 
               //  cordova.plugins.backgroundMode.enable();
          
          
               cordova.plugins.backgroundMode.on('enable', function(){
               
                   Utils.print("enable\n");
               });
               
     
               // cordova.plugins.backgroundMode.on('disable', function(){
               //     Utils.print("disable\n");
               // });
     
               cordova.plugins.backgroundMode.on('activate', function(){
				   
                   Utils.print("activate\n");
                   app.receivedEvent('GPS_read');
               });
			//autoStartPermissionPlugin.openAutostartPermissionPopup();
          
        cordova.plugins.autoStart.enable();
	   //cordova.plugins.backgroundMode.moveToBackground();
			  document.addEventListener('backbutton', onBackKeyDown, false);
        function onBackKeyDown(event) {
			 cordova.plugins.backgroundMode.moveToBackground();
			 cordova.plugins.backgroundMode.disableWebViewOptimizations(); 
			// alert(app.kendoApp.view().id)
			 if (app.kendoApp.view().id == "/") {
                 //navigator.app.exitApp();
             }
            return false;
        }
		
		     cordova.plugins.backgroundMode.overrideBackButton();
        } else if (id == "readFile") {

            if (res.fileexist != undefined && res.fileexist == false) {
                //TODO:PEDIMOS LAS COORDENADAS
                Utils.print("File with origin coords not found!")
                xc = 0;
                yc = 0;
            } else {
                var arr = JSON.parse(res.value)
                xc = arr[0];
                yc = arr[1];
            }

            var element = document.getElementById('oriCoordinates');
            element.innerHTML = 'Ori Lat: ' + yc + ' - Ori Lon: ' + xc;

            startPositioning();

        } else if (id == "writeFile") {            
        } else if (id == "GPS_read") {

       
            document.getElementById("cmdOrigin").removeAttribute("disabled"); //habilitamos el botón establecer origen!
            
            if (haversineDistance([xp, yp], [xc, yc]) < radioGPS) {
                Utils.print('We are IN - ' + haversineDistance([xp, yp], [xc, yc]).toFixed(3) + " - Rad GPS: " + radioGPS + " - " + cordova.plugins.backgroundMode.isActive());
                //Si acabamos de entrar y no hemos mandado el mensaje o no hemos logrado conectar con el módulo ble, lo intentamos de nuevo...
                if (openingRequested == false && (currentAttempt_toconnect_toBLE_ifinarea < no_attempts_toconnect_toBLE_ifinarea)) {
                    currentAttempt_toconnect_toBLE_ifinarea++;
                    stopPositioning();
                    bluetooth.enable();
                }
                //Si hemos agotado el número de intentos de conectar al módulo ble y seguimos dentro del área, marcamos como que hemos enviado.
                //Será necesario salir del área y volver a entrar para poder volver a forzar la conexión con el módulo BLE.
                if (currentAttempt_toconnect_toBLE_ifinarea >= no_attempts_toconnect_toBLE_ifinarea){
                    openingRequested = true;
                    currentAttempt_toconnect_toBLE_ifinarea=0;
                }
            } else {
                Utils.print('We are OUT - ' + haversineDistance([xp, yp], [xc, yc]).toFixed(3) + " - Rad GPS: " + radioGPS+ " - " + cordova.plugins.backgroundMode.isActive());
                //bluetooth.disconnect(mac);
                openingRequested = false;
            }

        } else if (id == "ble_enable") {

            if (res.isEnable == true) {
                Utils.print("Trying to connect to BLE device...");
                //bluetooth.autoConnect();
                bluetooth.connect(mac);
            } else {
                //TODO
                ons.notification.alert({
                    //message: 'Dispositivo vinculado correctamente',
                    messageHTML: '<div style="text-transform: none;">Ha sido imposible activar el bluetooth. Asegúrese de que el mismo se encuentra encendido.</div>',
                    title: '',
                    buttonLabel: 'Cerrar',
                    animation: 'default', // or 'none'
                    // modifier: 'optional-modifier'
                    callback: function () {
                        // Alert button is closed!
                        bluetooth.enable();
                    }
                });
            }

        } else if (id == "ble_scan_completed") {
            listBTSignals = Object.keys(params).map(function (key) {
                return params[key];
            });
            for (var i = 0; i < listBTSignals.length - 1; i++) {
                Utils.print(listBTSignals[i].name + " - " + listBTSignals[i].id + " - " + listBTSignals[i].rssi);

            }

            //si nuestra red está conectamos, si no, reintentamos...
            bluetooth.connect(mac);
        } else if (id == "ble_connect") {
            
            if (res.isConnected == true) {
                
                currentAttempt_toconnect_toBLE_ifinarea=0;
                Utils.print("Bluetooth connected!")
                
                bluetooth.stopNotification(mac);

                setTimeout(function () {

                    bluetooth.startNotification(mac);

                    rssiSample = setInterval(function () {
                        
                        ble.readRSSI(mac, function (rssi) {
                            Utils.print('read RSSI ' + rssi + ' from device ' + mac + " - Min RSSI to send: " + minRSSItosendopen);
                            if (rssi > minRSSItosendopen) {
                                bluetooth.write(mac, "00112233445566778899AABB");
                                clearInterval(rssiSample);
                                //TODO: ¿Qué pasa si el write falla...hemos salido del getRSSI!!!?
                                //bluetooth.disconnect(mac); //Finalización correcta!
                            }
                        }, function (err) {
                            Utils.print('unable to read RSSI - ' + err);
                            clearInterval(rssiSample);
                            //bluetooth.disconnect(mac); //DESCONECTAR DE LA RED
                            //startPositioning() //VOLVER A GEOPOSICIONAR
                        })
                        
                    }, 1000);

                }, 1000);

            } else {
                Utils.print("Bluetooth NOT connected!: TIMEOUT");
                startPositioning();
                clearInterval(rssiSample);                
            }
        } else if (id == "ble_autoconnect") {

            if (res.isConnected == true) {

                bluetooth.stopNotification(mac);

                setTimeout(function () {

                    bluetooth.startNotification(mac);

                    rssiSample = setInterval(function () {
                        ble.readRSSI(mac, function (rssi) {
                            Utils.print('read RSSI ' + rssi + ' from device ' + mac + " - Min RSSI to send: " + minRSSItosendopen);
                            if (rssi > minRSSItosendopen) {
                                bluetooth.write(mac, "00112233445566778899AABB");
                                clearInterval(rssiSample);
                                //TODO: ¿Qué pasa si el write falla...hemos salido del getRSSI!!!?
                                //bluetooth.disconnect(mac); //Finalización correcta!
                            }
                        }, function (err) {
                            Utils.print('unable to read RSSI - ' + err);
                            clearInterval(rssiSample);
                            //bluetooth.disconnect(mac); //DESCONECTAR DE LA RED
                            //startPositioning() //VOLVER A GEOPOSICIONAR
                        })
                    }, 1000);

                }, 1000);

            } else {
                clearInterval(rssiSample);
                startPositioning();
            }

        } else if (id == "ble_write") {
            if (res.isOK == true) {
                Utils.print("Message to BLE peripheral SUCCESS");
                openingRequested = true;
                bluetooth.disconnect(mac);
                startPositioning();
            } else {
                Utils.print("Message to BLE peripheral ERROR");
                //TODO:¿Qué hacemos en este caso?
            }
        } else if (id == "ble_disconnect") {
            if (res.isDisconnected == true) {
                if (openingRequested == false) {
                    //Se ha desconectado sin pedir la apertura, tenemos que volver a intentar conectar....
                    startPositioning();
                }
            }
        }

    }
};

var Utils = {

    stringToBytes: function (string) {
        var array = new Uint8Array(string.length + 1);
        for (var i = 0, l = string.length; i < l; i++) {
            array[i] = string.charCodeAt(i);
        }
        array[string.length] = 13;
        return array.buffer;
    },

    bytesToString: function (buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    },

    toHex: function (d) {
        return ("0" + (Number(d).toString(16))).slice(-2).toUpperCase();
    },

    hexToString: function (hexString) {
        return parseInt(hexString, 16);
    },

    print: function (message) {
        if (development) {
            console.log("> " + message);

            var element = document.getElementById('geolocation');
            element.innerHTML = '> ' + message + '<br />' + element.innerHTML; +
            '<hr />';

        }
    }
};

var bluetooth = {

    enable: function () {
        function success() {
            cordova.fireDocumentEvent('ble_enable', {
                isEnable: true
            });
        };

        function failure() {
            cordova.fireDocumentEvent('ble_enable', {
                isEnable: false
            });
        };
        ble.enable(success, failure);
    },

    autoConnect: function () {

        function success(device) {
            Utils.print("Autoconnected to BLE dev");
            cordova.fireDocumentEvent('ble_autoconnect', {
                isConnected: true,
                peripheral: device
            });
        };

        function failure(error) {
            Utils.print("Disconnected from BLE autoconnect - " + JSON.stringify(error));
            // cordova.fireDocumentEvent('ble_autoconnect', {
            //     isConnected: false
            // });
        };

        ble.autoConnect(mac, success, failure);
    },

    scan: function (millis) {

        function failure(obj) {
            Utils.print("failure");
            listBTSignals = [];
        };

        listBTSignals = [];

        ble.startScan([], function (device) {
            //Utils.print(JSON.stringify(device));
            listBTSignals.push(device);
        }, failure);

        setTimeout(function () {
            ble.stopScan();
            //Utils.print("BLE Scan finished!")
            cordova.fireDocumentEvent('ble_scan_completed', listBTSignals);
        }, millis);

    },

    connect: function (macAddress) {

        function success(obj) {
            //Utils.print("Connecting Success");            
            cordova.fireDocumentEvent('ble_connect', {
                isConnected: true
            });
        };

        function failure(obj) {
            //Utils.print("Connecting Error");
            cordova.fireDocumentEvent('ble_connect', {
                isConnected: false
            });
        };

        ble.connect(macAddress, success, failure);
    },

    disconnect: function (macAddress) {

        function success(obj) {
            Utils.print("Disconnect Success");
            cordova.fireDocumentEvent('ble_disconnect', {
                isDisconnected: true
            });
        };

        function failure(obj) {
            Utils.print("Disconnect Error");
            cordova.fireDocumentEvent('ble_disconnect', {
                isDisconnected: false
            });
        };

        ble.disconnect(macAddress, success, failure);
    },

    write: function (macAddress, message) {

        function success(obj) {
            Utils.print("<font color='red'>" + message + "</font>");
            cordova.fireDocumentEvent('ble_write', {
                isOK: true
            });
        };

        function failure(obj) {
            Utils.print("Error write: " + message);
            cordova.fireDocumentEvent('ble_write', {
                isOK: false
            });
        };

        ble.write(macAddress, service, characteristic, Utils.stringToBytes(message), success, failure);

    },

    read: function (macAddress) {

        var success = function (obj) {
            Utils.print("Success read");
            var text = new Uint8Array(obj);
            Utils.print("Text: " + Utils.bytesToString(text));

        };

        var failure = function (obj) {
            Utils.print("Error read");
        };

        ble.read(macAddress, service, characteristic, success, failure);
    },

    startNotification: function (macAddress) {

        var failure = function (obj) {
            Utils.print("Error starting notifications");
        };

        var success = function (datareceived) {
            // Decode the ArrayBuffer into a typed Array based on the data you expect
            data = new Uint8Array(datareceived);
            //Utils.print(Utils.bytesToString(data));
            incomingMessage += Utils.bytesToString(data);
            if (incomingMessage[incomingMessage.length - 1] == '\r') {
                cordova.fireDocumentEvent('ble_received', {
                    received: incomingMessage
                });
                incomingMessage = "";
            }
        }

        Utils.print("Starting notifications");
        ble.startNotification(macAddress, service, characteristic, success, failure);
    },

    stopNotification: function (macAddress) {

        var failure = function (obj) {
            Utils.print("Error stopping notifications");
        };

        var success = function (obj) {
            Utils.print("Stop notification success");
        };

        ble.stopNotification(macAddress, service, characteristic, success, failure);
    },

    readRSSI: function (macAddress) {

        var success = function (rssi) {
            Utils.print("read RSSI from " + macAddress + " - " + rssi);
        };

        var failure = function (error) {
            Utils.print("Error reading RSSI from " + macAddress + " - " + JSON.stringify(error));
        };

        ble.readRSSI(mac, success, failure);
    }
}

var protocol = {

    init: function (program) {},

    sendCommand: function () {
        // var comando = {
        //     "floorOrig": "FF",
        //     "floorDest": "FF",
        //     "accessOrig": "FF",
        //     "accessDest": "FF",
        //     "callType": "FF",
        //     "area": "FF",
        //     "NumPassengers": "FF",
        //     "userID": "FFFF",
        //     "noCabins": "FF",
        //     "prefCabin": "FF",
        //     "profile": "FF"
        // };
        // bluetooth.write(mac, JSON.stringify(comando));

        var comandoHex = "00112233445566778899AABB";
        bluetooth.write(mac, comandoHex);
        bluetooth.write(mac, "00112233445566778899AABB");
    }

}

var fileManager = {

    writeFile: function (cadena) {

        window.requestFileSystem(window.PERSISTENT, 0, successCallback, errorCallback);

        function successCallback(fs) {
            fs.root.getFile('orona.txt', {
                create: true
            }, function (fileEntry) {

                fileEntry.createWriter(function (fileWriter) {

                    fileWriter.onwriteend = function (e) {
                        Utils.print('Write completed.');
                        cordova.fireDocumentEvent('writeFile', {
                            result: "OK"
                        });
                    };

                    fileWriter.onerror = function (e) {
                        Utils.print('Write failed: ' + e.toString());
                        cordova.fireDocumentEvent('writeFile', {
                            result: "NOOK",
                            error: e.code
                        });
                    };

                    var blob = new Blob([cadena], {
                        type: 'text/plain'
                    });

                    fileWriter.write(blob);

                }, errorCallback);
            }, errorCallback);
        }

        function errorCallback(e) {
            //Utils.print("ERROR: " + e.code)
            cordova.fireDocumentEvent('writeFile', {
                result: "NOOK",
                error: e.code
            });
        }
    },

    readFile: function () {

        window.requestFileSystem(window.PERSISTENT, 0, successCallback, errorCallback);

        function successCallback(fs) {
            fs.root.getFile('orona.txt', {}, function (fileEntry) {

                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    reader.onloadend = function (e) {
                        Utils.print("readFile:" + this.result);
                        cordova.fireDocumentEvent('readFile', {
                            fileexist: true,
                            value: this.result
                        });
                    };
                    reader.readAsText(file);
                }, errorCallback);
            }, errorCallback);
        }

        function errorCallback(error) {
            //Utils.print("readFile ERROR: " + error.code);
            cordova.fireDocumentEvent('readFile', {
                fileexist: false
            });
        }
    },

    removeFile: function () {

        window.requestFileSystem(window.PERSISTENT, 0, successCallback, errorCallback);

        function successCallback(fs) {
            fs.root.getFile('orona.txt', {}, function (fileEntry) {
                fileEntry.remove(function (file) {
                    Utils.print("File deleted!");
                    cordova.fireDocumentEvent('removeFile', {
                        result: "ok"
                    });
                }, errorCallback);
            }, errorCallback);
        }

        function errorCallback(e) {
            //Utils.print("REMOVE ERROR: " + e.code);
            cordova.fireDocumentEvent('removeFile', {
                result: "nook",
                error: e.code
            });
        }
    }

};




app.initialize();