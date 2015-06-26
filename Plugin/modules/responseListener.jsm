/****************************************************************/
/* -- Fingerprint Privacy --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 15.04.2015                                             */
/****************************************************************/

var EXPORTED_SYMBOLS = ["responseListener"]; 

Components.utils.import("resource://modules/webIdentity.jsm");
Components.utils.import("resource://modules/detection.jsm");

Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

var Cc = Components.classes;
var Ci = Components.interfaces;

var contentTypes = ["text/html"];
var ascii_safe_charsets = ["utf-8", "utf8", "ascii", "iso-8859-1"];

// Helper function for XPCOM instanciation
function CCIN(cName, ifaceName) {
    return Cc[cName].createInstance(Ci[ifaceName]);
};

function getAttributeAction(attributes, attribute) {
    if (attributes) {
        for (var i = 0; i < attributes.length; i++) {
            if (attributes[i].name == attribute) {
                return attributes[i].action;    
            }
        }
    } 
};

function responseListener() {
    this.originalListener = null;   // Original listener allows to establish a call chain.
    this.intercept = false;         // Define if the incoming data should be intercepted or not.
    this.receivedData = [];         // Array for the incoming data.
};

responseListener.prototype = {
    onDataAvailable : function(request, context, inputStream, offset, count) {
        if (this.intercept) {
            var binaryInputStream = CCIN("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream");
            binaryInputStream.setInputStream(inputStream);
            var data = binaryInputStream.readBytes(count);
            this.receivedData.push(data);   
        } else {
            this.originalListener.onDataAvailable(request, context, inputStream, offset, count);
        }       	
    },

    onStartRequest : function(request, context) {
        this.intercept = this.isObservedType(request) && this.isCharsetCompatible(request);
        this.originalListener.onStartRequest(request, context);
    },

    onStopRequest : function(request, context, statusCode) {
        if (this.intercept) {
            // Get the HTTP channel from the request
            var httpChannel = request.QueryInterface(Ci.nsIHttpChannel);
            
            // Try to get the DOM window
            var DOMWindow;
            try {
                // Try to get the current request's DOM window ...
                DOMWindow = httpChannel.notificationCallbacks.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow); 
            } catch(e) {
                // If this happens, then this means that the current request has no DOM window, because maybe it was the very first
                // request or it was initiated by an external party such as AJAX, Flash, Silverlight, etc.
                DOMWindow = null;
            }

            // Try to get the referring domain
            var domain = null;
            var eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
            try {
                if (httpChannel.referrer) {
                    domain = eTLDService.getBaseDomain(httpChannel.referrer).toLowerCase();
                } else {
                    if (DOMWindow) {
                        var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService); 
                        var uri = ioService.newURI(DOMWindow.parent.document.URL, null, null); 
                        domain = eTLDService.getBaseDomain(uri).toLowerCase();
                    } else {
                        domain = 'localhost';
                    }
                }
            } catch(e) {
                domain = 'localhost';
            }

            // Try to get the web identitiy for the referring domain
            var webID = null;
            try {
                // Private browsing mode
                if (DOMWindow && PrivateBrowsingUtils.isWindowPrivate(DOMWindow)) {
                    webID = privateWebIdentity.getPrivateWebIdentity(domain);
                // Normal browsing mode
                } else {
                    webID = webIdentity.getWebIdentity(domain);
                } 
            } catch(e) {
                Components.utils.reportError(e);
            }

            // Initialize the script
            var script = "";

            if (webID && webID.enabled) {
                // Load the preferences
                var preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fingerprintprivacy.');
                
                // Try to get the fingerprint from the web identity
                var fingerprint;
                try {
                    fingerprint = webID.fingerprint;
                } catch(e) {
                    fingerprint = null;
                }

                // Try to get the attributes for the referring domain
                var attributes;
                try {
                    attributes = detection.getDetection(domain).attributes;    
                } catch(e) {
                    attributes = null;
                }
                script += "\r\n<script type=\"text/javascript\">";
                script += "\r\n/* FingerPrint-Block (C) developed by Christof Torres 2014 - 2015. */";
                // *** Standard navigator object properties ***
                // -- App Code Name --
                if (getAttributeAction(attributes, "App Code Name") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('appCodeName', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":App Code Name'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "App Code Name") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.appCodeName+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- App Name --
                if (getAttributeAction(attributes, "App Name") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('appName', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":App Name'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "App Name") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.appName+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- App Version --
                if (getAttributeAction(attributes, "App Version") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('appVersion', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":App Version'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "App Version") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.appVersion+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- Battery --
                if (getAttributeAction(attributes, "Battery") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('battery', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Battery'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Connection --
                if (getAttributeAction(attributes, "Connection") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('connection', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Connection'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Geolocation --
                if (getAttributeAction(attributes, "Geolocation") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('geolocation', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Geolocation'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Java Enabled --
                if (getAttributeAction(attributes, "Java Enabled") != "allow") {
                    script += "\r\nnavigator.javaEnabled = function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Java Enabled'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); };";
                }
                // -- Language --
                if (getAttributeAction(attributes, "Language") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('language', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Language'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Language") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.language+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- Mime Types --
                try {
                    var browserplugins = webID.browserplugins;
                    script += "\r\nvar mimeTypes = {};";
                    script += "\r\nvar length = 0;";
                    if (browserplugins.flash) {
                        script += "\r\nfor (var i = 0; i < navigator.mimeTypes.length; i++) { if (navigator.mimeTypes[i].enabledPlugin.name.indexOf('Flash') != -1) { mimeTypes[length++] = navigator.mimeTypes[i]; mimeTypes[navigator.mimeTypes[i].type] = navigator.mimeTypes[i]; } }";
                    }
                    if (browserplugins.silverlight) {
                        script += "\r\nfor (var i = 0; i < navigator.mimeTypes.length; i++) { if (navigator.mimeTypes[i].enabledPlugin.name.indexOf('Silverlight') != -1) { mimeTypes[length++] = navigator.mimeTypes[i]; mimeTypes[navigator.mimeTypes[i].type] = navigator.mimeTypes[i]; } }";
                    }
                    if (browserplugins.vlc) {
                        script += "\r\nfor (var i = 0; i < navigator.mimeTypes.length; i++) { if (navigator.mimeTypes[i].enabledPlugin.name.indexOf('VLC') != -1) { mimeTypes[length++] = navigator.mimeTypes[i]; mimeTypes[navigator.mimeTypes[i].type] = navigator.mimeTypes[i]; } }";
                    }
                    if (browserplugins.quicktime) {
                        script += "\r\nfor (var i = 0; i < navigator.mimeTypes.length; i++) { if (navigator.mimeTypes[i].enabledPlugin.name.indexOf('QuickTime') != -1) { mimeTypes[length++] = navigator.mimeTypes[i]; mimeTypes[navigator.mimeTypes[i].type] = navigator.mimeTypes[i]; } }";
                    }
                    if (browserplugins.other) {
                        script += "\r\nfor (var i = 0; i < navigator.mimeTypes.length; i++) { if (navigator.mimeTypes[i].enabledPlugin.name.indexOf('Flash') == -1 && navigator.mimeTypes[i].enabledPlugin.name.indexOf('Silverlight') == -1 && navigator.mimeTypes[i].enabledPlugin.name.indexOf('VLC') == -1 && navigator.mimeTypes[i].enabledPlugin.name.indexOf('QuickTime') == -1) { mimeTypes[length++] = navigator.mimeTypes[i]; mimeTypes[navigator.mimeTypes[i].type] = navigator.mimeTypes[i]; } }";
                    }
                    script += "\r\nmimeTypes['length'] = length;";
                    script += "\r\nnavigator.__defineGetter__('mimeTypes', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Mime Types'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(mimeTypes); });";
                } catch(e) {
                    script += "\r\nvar mimeTypes = [];";
                    script += "\r\nnavigator.__defineGetter__('mimeTypes', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Mime Types'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(mimeTypes); });";
                }
                // -- Online --
                if (getAttributeAction(attributes, "Online") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('onLine', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Online'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- OS CPU --
                if (getAttributeAction(attributes, "OS CPU") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('oscpu', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":OS CPU'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "OS CPU") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.oscpu+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- Platform --
                if (getAttributeAction(attributes, "Platform") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('platform', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Platform'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Platform") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.platform+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- Plugins --
                try {
                    var browserplugins = webID.browserplugins;
                    script += "\r\nvar plugins = {};";
                    script += "\r\nvar length = 0;";
                    if (browserplugins.flash) {
                        script += "\r\nfor (var i = 0; i < navigator.plugins.length; i++) { if (navigator.plugins[i].name.indexOf('Flash') != -1) { plugins[length++] = navigator.plugins[i]; plugins[navigator.plugins[i].name] = navigator.plugins[i]; } }";
                    }
                    if (browserplugins.silverlight) {
                        script += "\r\nfor (var i = 0; i < navigator.plugins.length; i++) { if (navigator.plugins[i].name.indexOf('Silverlight') != -1) { plugins[length++] = navigator.plugins[i]; plugins[navigator.plugins[i].name] = navigator.plugins[i]; } }";
                    }
                    if (browserplugins.vlc) {
                        script += "\r\nfor (var i = 0; i < navigator.plugins.length; i++) { if (navigator.plugins[i].name.indexOf('VLC') != -1) { plugins[length++] = navigator.plugins[i]; plugins[navigator.plugins[i].name] = navigator.plugins[i]; } }";
                    }
                    if (browserplugins.quicktime) {
                        script += "\r\nfor (var i = 0; i < navigator.plugins.length; i++) { if (navigator.plugins[i].name.indexOf('QuickTime') != -1) { plugins[length++] = navigator.plugins[i]; plugins[navigator.plugins[i].name] = navigator.plugins[i]; } }";
                    }
                    if (browserplugins.other) {
                        script += "\r\nfor (var i = 0; i < navigator.plugins.length; i++) { if (navigator.plugins[i].name.indexOf('Flash') == -1 && navigator.plugins[i].name.indexOf('Silverlight') == -1 && navigator.plugins[i].name.indexOf('VLC') == -1 && navigator.plugins[i].name.indexOf('QuickTime') == -1) { plugins[length++] = navigator.plugins[i]; plugins[navigator.plugins[i].name] = navigator.plugins[i]; } }";
                    }
                    script += "\r\nplugins['length'] = length;"; 
                    script += "\r\nnavigator.__defineGetter__('plugins', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Plugins'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(plugins); });";
                } catch(e) {
                    script += "\r\nvar plugins = [];";
                    script += "\r\nnavigator.__defineGetter__('plugins', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Plugins'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(plugins); });";
                }
                // -- Product --
                if (getAttributeAction(attributes, "Product") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('product', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Product'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Product") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.product+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- User-Agent --
                if (getAttributeAction(attributes, "User-Agent") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('userAgent', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":User-Agent'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);"; 
                    if (getAttributeAction(attributes, "User-Agent") == "spoof" && fingerprint) { script += " return('"+fingerprint.useragent+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // *** Non-standard navigator object properties ***
                // -- Build ID --
                if (getAttributeAction(attributes, "Build ID") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('buildID', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Build ID'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Cookies Enabled --
                if (getAttributeAction(attributes, "Cookies Enabled") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('cookieEnabled', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Cookies Enabled'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Do Not Track --
                if (getAttributeAction(attributes, "Do Not Track") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('doNotTrack', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Do Not Track'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- ID --
                if (getAttributeAction(attributes, "ID") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('id', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":ID'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Product Subversion --
                if (getAttributeAction(attributes, "Product Subversion") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('productSub', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Product Subversion'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Vendor --
                if (getAttributeAction(attributes, "Vendor") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('vendor', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Vendor'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Vendor") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.vendor+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- Vendor Subversion --
                if (getAttributeAction(attributes, "Vendor Subversion") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('vendorSub', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Vendor Subversion'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- MozBattery --
                if (getAttributeAction(attributes, "MozBattery") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('mozBattery', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":MozBattery'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- CPU Class --
                if (getAttributeAction(attributes, "CPU Class") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('cpuClass', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":CPU Class'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "CPU Class") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.cpuClass+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- System Language --
                if (getAttributeAction(attributes, "System Language") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('systemLanguage', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":System Language'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "System Language") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.systemLanguage+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- User Language --
                if (getAttributeAction(attributes, "User Language") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('userLanguage', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":User Language'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "User Language") == "spoof" && fingerprint) { script += " return('"+fingerprint.navigator.userLanguage+"');"; } else { script += " return(undefined);"; } script += " });";
                }
                // *** Screen object properties ***
                // -- Height --
                if (getAttributeAction(attributes, "Screen Height") != "allow") {
                    script += "\r\nscreen.__defineGetter__('height', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Screen Height'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Screen Height") == "spoof" && fingerprint) { script += " return("+fingerprint.screen.height+");"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- Width --
                if (getAttributeAction(attributes, "Screen Width") != "allow") {
                    script += "\r\nscreen.__defineGetter__('width', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Screen Width'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Screen Width") == "spoof" && fingerprint) { script += " return("+fingerprint.screen.width+");"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- Color Depth --
                if (getAttributeAction(attributes, "Color Depth") != "allow") {
                    script += "\r\nscreen.__defineGetter__('colorDepth', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Color Depth'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Color Depth") == "spoof" && fingerprint) { script += " return("+fingerprint.screen.colorDepth+");"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- Available Height --
                if (getAttributeAction(attributes, "Available Height") != "allow") {
                    script += "\r\nscreen.__defineGetter__('availHeight', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Available Height'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Available Height") == "spoof" && fingerprint) { script += " return("+fingerprint.screen.availHeight+");"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- Available Width --
                if (getAttributeAction(attributes, "Available Width") != "allow") {
                    script += "\r\nscreen.__defineGetter__('availWidth', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Available Width'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Available Width") == "spoof" && fingerprint) { script += " return("+fingerprint.screen.availWidth+");"; } else { script += " return(undefined);"; } script += " });";
                }
                // -- Pixel Depth --
                if (getAttributeAction(attributes, "Pixel Depth") != "allow") {
                    script += "\r\nscreen.__defineGetter__('pixelDepth', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Pixel Depth'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Pixel Depth") == "spoof" && fingerprint) { script += " return("+fingerprint.screen.pixelDepth+");"; } else { script += " return(undefined);"; } script += " });";
                }
                // *** Date object properties ***
                // -- Timezone --
                if (getAttributeAction(attributes, "Timezone") != "allow") {
                    script += "\r\nDate.prototype.getTimezoneOffset = function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Timezone'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event);";
                    if (getAttributeAction(attributes, "Timezone") == "spoof" && fingerprint) { script += " return("+fingerprint.date.timezoneOffset+");"; } else { script += " return(undefined);"; } script += " };";
                }
                // *** DOM Local Storage ***
                if (getAttributeAction(attributes, "DOM Local Storage") != "allow") {
                    script += "\r\nfor (var key in localStorage) { localStorage.__defineGetter__(key, function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Local Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); }); }";
                }
                // -- Key --
                if (getAttributeAction(attributes, "DOM Local Storage") != "allow") {
                    script += "\r\nlocalStorage.__defineGetter__('key', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Local Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Get Item --
                if (getAttributeAction(attributes, "DOM Local Storage") != "allow") {
                    script += "\r\nlocalStorage.__defineGetter__('getItem', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Local Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Set Item --
                if (getAttributeAction(attributes, "DOM Local Storage") != "allow") {
                    script += "\r\nlocalStorage.__defineGetter__('setItem', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Local Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Remove Item --
                if (getAttributeAction(attributes, "DOM Local Storage") != "allow") {
                    script += "\r\nlocalStorage.__defineGetter__('removeItem', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Local Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // *** DOM Session Storage ***
                if (getAttributeAction(attributes, "DOM Session Storage") != "allow") {
                    script += "\r\nfor (var key in sessionStorage) { sessionStorage.__defineGetter__(key, function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Session Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); }); }";
                }
                // -- Key --
                if (getAttributeAction(attributes, "DOM Session Storage") != "allow") {
                    script += "\r\nsessionStorage.__defineGetter__('key', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Session Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Get Item --
                if (getAttributeAction(attributes, "DOM Session Storage") != "allow") {
                    script += "\r\nsessionStorage.__defineGetter__('getItem', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Session Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Set Item --
                if (getAttributeAction(attributes, "DOM Session Storage") != "allow") {
                    script += "\r\nsessionStorage.__defineGetter__('setItem', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Session Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- Remove Item --
                if (getAttributeAction(attributes, "DOM Session Storage") != "allow") {
                    script += "\r\nsessionStorage.__defineGetter__('removeItem', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Session Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // *** Window ***
                // -- DOM Local Stroage --
                if (getAttributeAction(attributes, "DOM Local Storage") != "allow") {
                    script += "\r\nwindow.__defineGetter__('localStorage', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Local Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- DOM Session Stroage --
                if (getAttributeAction(attributes, "DOM Session Storage") != "allow") {
                    script += "\r\nwindow.__defineGetter__('sessionStorage', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":DOM Session Storage'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- IndexedDB --
                if (getAttributeAction(attributes, "IndexedDB") != "allow") {
                    script += "\r\nwindow.__defineGetter__('indexedDB', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":IndexedDB'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- OpenDatabase --
                if (getAttributeAction(attributes, "OpenDatabase") != "allow") {
                    script += "\r\nwindow.__defineGetter__('openDatabase', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":OpenDatabase'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // -- WebGL Rendering Context --
                if (getAttributeAction(attributes, "WebGL Rendering Context") != "allow") {
                    script += "\r\nwindow.__defineGetter__('WebGLRenderingContext', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":WebGL Rendering Context'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // *** Canvas Fingerprinting ***
                // -- Canvas Fill Text --
                if (getAttributeAction(attributes, "Canvas Fill Text") != "allow") {
                    script += "\r\nvar original_fillText = CanvasRenderingContext2D.prototype.fillText;";
                    script += "\r\nCanvasRenderingContext2D.prototype.fillText = function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Canvas Fill Text'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); original_fillText.apply(this, arguments); };";
                }
                // -- Canvas Stroke Text --
                if (getAttributeAction(attributes, "Canvas Stroke Text") != "allow") {
                    script += "\r\nvar original_strokeText = CanvasRenderingContext2D.prototype.strokeText;";
                    script += "\r\nCanvasRenderingContext2D.prototype.strokeText = function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Canvas Stroke Text'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); original_strokeText.apply(this, arguments); };";
                }
                // -- Canvas To Data URL --
                if (getAttributeAction(attributes, "Canvas To Data URL") != "allow") {
                    script += "\r\nvar original_toDataURL = HTMLCanvasElement.prototype.toDataURL;";
                    script += "\r\nHTMLCanvasElement.prototype.toDataURL = function(){";
                    if (detection.getDetection(domain) && detection.getDetection(domain).canvas.data != null) {
                        script += " var element = document.createElement('DetectionDataElement'); if (arguments.length > 0) { element.setAttribute('attribute', '"+webID.domain+":Canvas To Data URL - '+getAmountOfColors(this.getContext('2d').getImageData(0, 0, this.width, this.height))+', '+this.width+', '+this.height+', '+arguments[0]+', null'); } else { element.setAttribute('attribute', '"+webID.domain+":Canvas To Data URL - '+getAmountOfColors(this.getContext('2d').getImageData(0, 0, this.width, this.height))+', '+this.width+', '+this.height+', null, null'); } document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return('"+detection.getDetection(domain).canvas.data+"'); };";
                    } else {
                        script += " generateNoise(this); var result = original_toDataURL.apply(this, arguments); var element = document.createElement('DetectionDataElement'); if (arguments.length > 0) { element.setAttribute('attribute', '"+webID.domain+":Canvas To Data URL - '+getAmountOfColors(this.getContext('2d').getImageData(0, 0, this.width, this.height))+', '+this.width+', '+this.height+', '+arguments[0]+', '+result); } else { element.setAttribute('attribute', '"+webID.domain+":Canvas To Data URL - '+getAmountOfColors(this.getContext('2d').getImageData(0, 0, this.width, this.height))+', '+this.width+', '+this.height+', null, '+result); } document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(result); };";
                    }
                    // -- Function used to count the amount of colors on the canvas --
                    script += "\r\nfunction getAmountOfColors(imgData){var colors=[];for(var i=0;i<imgData.data.length;i+=4){if(colors.length == 0){colors.push(new Array(imgData.data[i+0],imgData.data[i+1],imgData.data[i+2],imgData.data[i+3]));}else{var j=0;var exists=false;while(j<colors.length && !exists){if(colors[j][0] == imgData.data[i+0] && colors[j][1] == imgData.data[i+1] && colors[j][2] == imgData.data[i+2] && colors[j][3] == imgData.data[i+3]){exists=true;}j++;}if(!exists){colors.push(new Array(imgData.data[i+0],imgData.data[i+1],imgData.data[i+2],imgData.data[i+3]));}}}return colors.length}";
                    // -- Function used to generate and inject random noise into the canvas --
                    script += "\r\nfunction generateNoise(canvas){var imgData=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);for(var i=0;i<imgData.data.length;i+=4){imgData.data[i+0]=Math.floor(Math.random()*256);imgData.data[i+1]=Math.floor(Math.random()*256);imgData.data[i+2]=Math.floor(Math.random()*256);}canvas.getContext('2d').putImageData(imgData,0,0);var imageObj=new Image();imageObj.onload=function(){canvas.getContext('2d').drawImage(imageObj,Math.floor(Math.random()*(canvas.width-imageObj.width)),Math.floor(Math.random()*(canvas.height-imageObj.height)));};var min = Math.min(canvas.width,canvas.height);if(min <= 32){imageObj.src='chrome://fingerprintprivacy/skin/toolbar-icon.png';}else if(min <= 64){imageObj.src='chrome://fingerprintprivacy/skin/icon32.png';}else if(min <= 128){imageObj.src='chrome://fingerprintprivacy/skin/icon64.png';}else{imageObj.src='chrome://fingerprintprivacy/skin/logo.png';}};";
                }
                // *** JavaScript based font detection ***
                // -- Get the ground truth --
                if (getAttributeAction(attributes, "Element Offset Width") != "allow" || getAttributeAction(attributes, "Element Offset Height") != "allow") {
                    script += "\r\nvar width = 0; var height = 0;";
                    script += "\r\nwindow.onload = function(){var h = document.getElementsByTagName('BODY')[0];var d = document.createElement('DIV');var s = document.createElement('SPAN');d.appendChild(s);d.style.fontFamily = 'sans';s.style.fontFamily = 'sans';s.style.fontSize = '72px';s.style.backgroundColor = 'white';s.style.color = 'white';s.innerHTML = 'mmmmmmmmmmlil';h.appendChild(d);width = s.offsetWidth;height = s.offsetHeight;h.removeChild(d);};";
                }
                // -- Element Offset Width --
                if (getAttributeAction(attributes, "Element Offset Width") != "allow") {
                    script += "\r\nHTMLElement.prototype.offsetWidth = function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Element Offset Width'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(width); };";
                }
                // -- Element Offset Height --
                if (getAttributeAction(attributes, "Element Offset Height") != "allow") {
                    script += "\r\nHTMLElement.prototype.offsetHeight = function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":Element Offset Height'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(height); };";
                }
                // *** IE userData ***
                // -- AddBehavior --
                if (getAttributeAction(attributes, "IE userData") != "allow") {
                    script += "\r\nElement.prototype.addBehavior = function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":IE userData'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); };";
                }
                // -- Save --
                if (getAttributeAction(attributes, "IE userData") != "allow") {
                    script += "\r\nElement.prototype.save = function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":IE userData'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); };";
                }
                // -- Load --
                if (getAttributeAction(attributes, "IE userData") != "allow") {
                    script += "\r\nElement.prototype.load = function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":IE userData'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); };";
                }
                // -- MSIE Security Policy --
                if (getAttributeAction(attributes, "IE Security Policy") != "allow") {
                    script += "\r\nnavigator.__defineGetter__('securityPolicy', function(){ var element = document.createElement('DetectionDataElement'); element.setAttribute('attribute', '"+webID.domain+":IE Security Policy'); document.documentElement.appendChild(element); var event = document.createEvent('Events'); event.initEvent('DetectionEvent', true, false); element.dispatchEvent(event); return(undefined); });";
                }
                // *** Remove this script to prevent reading it from JavaScript ***
                script += "\r\nvar thisScriptElement = document.getElementsByTagName('script')[0]; thisScriptElement.parentNode.removeChild(thisScriptElement);";
                script += "\r\n</script>\r\n";
            }
        
            var data = this.receivedData.join("");
            
            var pattern = /(<head[^>]*>)/i;
            data = data.replace(pattern, "$1" + script);
            
            this.receivedData = null;

            var new_data = data;
            var storageStream = CCIN("@mozilla.org/storagestream;1", "nsIStorageStream");
            storageStream.init(8192, new_data.length, null);
            if (new_data.length > 0) {
                try {
                    var outputStream = storageStream.getOutputStream(0);
                    outputStream.write(new_data, new_data.length);
                    outputStream.close();
                } catch(e) { 
                    Components.utils.reportError(e);
                }
            }

            try {
                this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), 0, new_data.length);
            } catch(e) {
                Components.utils.reportError(e);
            }
            
            try {
                this.originalListener.onStopRequest(request, context, statusCode);
            } catch(e) { 
                Components.utils.reportError(e);
            }

        } else {
            this.originalListener.onStopRequest(request, context, statusCode);
        }
    },

    isObservedType : function(subject) {
        try {
            if (subject instanceof Ci.nsIHttpChannel) {
                subject.QueryInterface(Ci.nsIHttpChannel);
                var contentType = subject.getResponseHeader("Content-Type");
                if (contentType == null) {
                    return false;
                }
                for (var i = 0; i < contentTypes.length; ++i) {
                    if (contentType.indexOf(contentTypes[i]) !== -1) {
                        return true;
                    } 
                }
                return false;
            }
        } catch(e) {
            return false;
        }
    },

    isCharsetCompatible : function(subject) {
        subject.QueryInterface(Ci.nsIChannel);
        var charset = subject.contentCharset;
        if (charset == null || charset == "") {
            return true;
        }
        charset = charset.toLowerCase();
        for (var i = 0; i < ascii_safe_charsets.length; ++i) {
            var set = ascii_safe_charsets[i];
            if (set == charset) {
                return true;
            }
        }
        return false;
    },

    QueryInterface : function(aIID) {
        if (aIID.equals(Ci.nsIStreamListener) || aIID.equals(Ci.nsISupports)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    }
};
