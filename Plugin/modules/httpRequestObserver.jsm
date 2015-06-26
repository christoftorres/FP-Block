/****************************************************************/
/* -- Fingerprint Privacy --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 15.04.2015                                             */
/****************************************************************/

var EXPORTED_SYMBOLS = ["httpRequestObserver"]; 

Components.utils.import("resource://modules/webIdentity.jsm");
Components.utils.import("resource://modules/detection.jsm");
Components.utils.import("resource://modules/randomFingerprintGenerator.jsm");
Components.utils.import("resource://modules/responseListener.jsm");

Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

var Cc = Components.classes;
var Ci = Components.interfaces;

var httpRequestObserver = {
	observe : function(subject, topic, data) {
		// On HTTP request
		if (topic == "http-on-modify-request") {
            try {
                // Get the HTTP channel of the current request
                var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
                
                // Get the preferences and the effective TLD service
                var preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fingerprintprivacy.');
			    var eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
                
                // Try to get the requesting domain
                var requestDomain = null;
                try {
                    requestDomain = eTLDService.getBaseDomain(httpChannel.originalURI).toLowerCase();
                } catch(e) {
                    requestDomain = 'localhost';
                }

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
                var referrerDomain = null;
                try {
                    if (DOMWindow) {
                        var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService); 
                        var uri = ioService.newURI(DOMWindow.top.document.URL, null, null); 
                        referrerDomain = eTLDService.getBaseDomain(uri).toLowerCase();
                    } else {
                        referrerDomain = eTLDService.getBaseDomain(httpChannel.referrer).toLowerCase();
                    }
                } catch(e) {
                    referrerDomain = 'localhost';
                }

                // Try to get the web identitiy for the referring domain
                var webID = null;
                try {
                    // Private browsing mode
                    if (DOMWindow && PrivateBrowsingUtils.isWindowPrivate(DOMWindow)) {
                        webID = privateWebIdentity.getPrivateWebIdentity(referrerDomain);
                    // Normal browsing mode
                    } else {
                        webID = webIdentity.getWebIdentity(referrerDomain);
                    } 
                } catch(e) {
                    Components.utils.reportError(e);
                }        

                // Create a new web identity if the web identity is not present
                if (!webID) {
                    // Create a new social plugins object for the new web identity
                    var socialplugins = {facebook : undefined, twitter : undefined , googleplus : undefined, linkedin : undefined, tumblr : undefined, pinterest : undefined};
                    // Create a new browser plugins object for the new web identity
                    var browserplugins = null;
                    if (preferences.getBoolPref('autoblockplugins')) {
                        browserplugins = {flash : false, silverlight : false, vlc : false, quicktime : false, other : false};
                    } else {
                        browserplugins = {flash : true, silverlight : true, vlc : true, quicktime : true, other : true};
                    }
                    // Create a new fingerprint for the new web identity
                    try {
                        // Private browsing mode
                        if (DOMWindow && PrivateBrowsingUtils.isWindowPrivate(DOMWindow)) {
                            var generatedFingerprint = randomFingerprintGenerator.generateAndCheckUniqueness(privateWebIdentity.getPrivateWebIdentities());
                            privateWebIdentity.addPrivateWebIdentity(referrerDomain, generatedFingerprint.fingerprint, generatedFingerprint.profile, generatedFingerprint.hash, generatedFingerprint.usage, socialplugins, browserplugins);
                            webID = privateWebIdentity.getPrivateWebIdentity(referrerDomain);
                        // Normal browsing mode
                        } else {
                            var generatedFingerprint = randomFingerprintGenerator.generateAndCheckUniqueness(webIdentity.getWebIdentities());
                            webIdentity.addWebIdentity(referrerDomain, generatedFingerprint.fingerprint, generatedFingerprint.profile, generatedFingerprint.hash, generatedFingerprint.usage, socialplugins, browserplugins);
                            webID = webIdentity.getWebIdentity(referrerDomain);
                        }
                    } catch(e) {
                        Components.utils.reportError(e);
                    }
                } 

                if (webID && webID.enabled) {
                    
                    var previousDate = new Date(webID.usage.date);
                    var currentDate = new Date();
                    // Increment usage amount if it's not the same day
                    if (previousDate.getFullYear != currentDate.getFullYear || previousDate.getMonth != currentDate.getMonth || previousDate.getDate != currentDate.getDate) {
                        webID.usage.amount++;
                    }
                    // Set current date
                    webID.usage.date = currentDate;
                    
                    if (!detection.getAttribute(referrerDomain, 'User-Agent') || detection.getAttribute(referrerDomain, 'User-Agent').action == 'spoof') {
                        // Set new user-agent string based on the saved fingerprint for the referring domain
                        httpChannel.setRequestHeader("User-Agent", webID.fingerprint.useragent, false);
                        // Set the Accept-Encoding header
                        httpChannel.setRequestHeader("Accept-Encoding", webID.fingerprint.accept.acceptEncoding, false);
                    } else
                    if (detection.getAttribute(referrerDomain, 'User-Agent').action == 'block') {
                        // Remove user-agent string for the referring domain
                        httpChannel.setRequestHeader("User-Agent", "", false);
                        // Remove the Accept-Encoding header
                        httpChannel.setRequestHeader("Accept-Encoding", "", false);
                    }

                    if (!detection.getAttribute(referrerDomain, 'Language') || detection.getAttribute(referrerDomain, 'Language').action == 'spoof') {
                        // Set the Accept-Language header
                        httpChannel.setRequestHeader("Accept-Language", webID.fingerprint.navigator.language, false);
                    } else
                    if (detection.getAttribute(referrerDomain, 'Language').action == 'block') {
                        // Remove the Accept-Language header
                        httpChannel.setRequestHeader("Accept-Language", "", false);
                    }
                    
                    // Remove possible ETag headers from request
                    // NOTE: Setting a header to nothing and merge to false, removes the header from the request
                    if (preferences.getBoolPref('deleteetags')) {
                        httpChannel.setRequestHeader("If-Match", "", false);
                        httpChannel.setRequestHeader("If-None-Match", "", false);
                        httpChannel.setRequestHeader("If-Range", "", false);
                    }

                    if (referrerDomain.substring(0, referrerDomain.lastIndexOf(".")) != requestDomain.substring(0, requestDomain.lastIndexOf("."))) {
                        // Get third-parties for the referring domain
                        var thirdparties = webID.thirdparties;
                        // Add requested domain to third-parties if not present
                        var exists = false;
                        var i = 0;
                        while (!exists && i < thirdparties.length) {
                            if (thirdparties[i].name == requestDomain) {
                                exists = true;
                            }     
                            i++; 
                        }
                        if (!exists) {
                            thirdparties.push({name : requestDomain, enabled : true}); 
                        }
                        // Block third-parties
                        for (var i = 0; i < thirdparties.length; i++) {
                            if (thirdparties[i].enabled == false) {
                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);
                            }
                        }
                        
                        // Remove referrer header from the request in order to preserve privacy
    				    // NOTE: Setting a header to nothing and merge to false, removes the header from the request
                        //if (preferences.getBoolPref('deletereferer')) {
                        //    httpChannel.setRequestHeader("Referer", "", false);
                        //}
                        
                        // SOCIAL PLUGINS:
                        // We abort the communication and reject the request if it's part of a social plugin
                        
                        // Facebook
                        if (httpChannel.originalURI.spec.indexOf("connect.facebook.net/en_US/all.js") != -1 || 
                            httpChannel.originalURI.spec.indexOf("facebook.com/plugins/") != -1) {
                            if (webID.socialplugins.facebook == undefined) {
                                if (preferences.getBoolPref('autoblocksocial')) {
                                    webID.socialplugins.facebook = false;
                                } else {
                                    webID.socialplugins.facebook = true;
                                }
                            }
                            if (!webID.socialplugins.facebook) {
                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);
                            }
                        }
                        // Twitter
                        if (httpChannel.originalURI.spec.indexOf("platform.twitter.com/widgets.js") != -1 ||
                            httpChannel.originalURI.spec.indexOf("platform.twitter.com/widgets/") != -1) {
                            if (webID.socialplugins.twitter == undefined) {
                                if (preferences.getBoolPref('autoblocksocial')) {
                                    webID.socialplugins.twitter = false;
                                } else {
                                    webID.socialplugins.twitter = true;
                                }
                            }
                            if (!webID.socialplugins.twitter) {
                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);
                            }
                        }
                        // Google Plus
                        if (httpChannel.originalURI.spec.indexOf("apis.google.com/js/platform.js") != -1 || 
                            httpChannel.originalURI.spec.indexOf("apis.google.com/js/plusone.js") != -1) {
                            if (webID.socialplugins.googleplus == undefined) {
                                if (preferences.getBoolPref('autoblocksocial')) {
                                    webID.socialplugins.googleplus = false;
                                } else {
                                    webID.socialplugins.googleplus = true;
                                }
                            }
                            if (!webID.socialplugins.googleplus) {
                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);
                            }
                        }
                        // LinkedIn
                        if (httpChannel.originalURI.spec.indexOf("platform.linkedin.com/in.js") != -1) {
                            if (webID.socialplugins.linkedin == undefined) {
                                if (preferences.getBoolPref('autoblocksocial')) {
                                    webID.socialplugins.linkedin = false;
                                } else {
                                    webID.socialplugins.linkedin = true;
                                }
                            }
                            if (!webID.socialplugins.linkedin) {
                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);
                            }
                        }
                        // Tumblr
                        if (httpChannel.originalURI.spec.indexOf("platform.tumblr.com/v1/") != -1) {
                            if (webID.socialplugins.tumblr == undefined) {
                                if (preferences.getBoolPref('autoblocksocial')) {
                                    webID.socialplugins.tumblr = false;
                                } else {
                                    webID.socialplugins.tumblr = true;
                                }
                            }
                            if (!webID.socialplugins.tumblr) {
                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);
                            }
                        }
                        // Pinterest
                        if (httpChannel.originalURI.spec.indexOf("assets.pinterest.com/js/pinit.js") != -1) {
                            if (webID.socialplugins.pinterest == undefined) {
                                if (preferences.getBoolPref('autoblocksocial')) {
                                    webID.socialplugins.pinterest = false;
                                } else {
                                    webID.socialplugins.pinterest = true;
                                }
                            }
                            if (!webID.socialplugins.pinterest) {
                                httpChannel.cancel(Components.results.NS_BINDING_ABORTED);
                            }
                        }
                    }
                }
            } catch(e) {
                Components.utils.reportError(e);
            }
		} else 
		// On HTTP response
		if (topic == "http-on-examine-response" || topic == "http-on-examine-cached-response") {
            if (subject instanceof Ci.nsIHttpChannel) {
                subject.QueryInterface(Ci.nsITraceableChannel);
                subject.QueryInterface(Ci.nsIHttpChannel);
                var newListener = new responseListener();
                newListener.originalListener = subject.setNewListener(newListener);
            }
        }
	},

	QueryInterface : function(aIID) {
        if (aIID.equals(Ci.nsIObserver) || aIID.equals(Ci.nsISupports)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    },

	register : function() {
		this.observerService.addObserver(this, "http-on-modify-request", false);
		this.observerService.addObserver(this, "http-on-examine-response", false);
		this.observerService.addObserver(this, "http-on-examine-cached-response", false);
	},

	unregister : function() {
		this.observerService.removeObserver(this, "http-on-modify-request");
		this.observerService.removeObserver(this, "http-on-examine-response");
		this.observerService.removeObserver(this, "http-on-examine-cached-response");
	},

    get observerService() {
        return Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
    }
};
