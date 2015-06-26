/****************************************************************/
/* -- Fingerprint Privacy --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 11.02.2015                                             */
/****************************************************************/

var EXPORTED_SYMBOLS = ["webIdentity", "privateWebIdentity"]; 

var Cc = Components.classes;
var Ci = Components.interfaces;

var webIdentity = {
	webidentities : [],
	
    loadWebIdentities : function() {
        var preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fingerprintprivacy.');
        this.webidentities = JSON.parse(preferences.getCharPref('webidentities'));
    },

    saveWebIdentities : function() {
        var preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fingerprintprivacy.');
        preferences.setCharPref('webidentities', JSON.stringify(this.webidentities));
    },

    clearWebIdentities : function() {
        this.webidentities = [];
    },

    deleteWebIdentity : function(domain) {
        for (var i = 0; i < this.webidentities.length; i++) {
            if (this.webidentities[i].domain == domain) {
                this.webidentities.splice(i,1);
                return;
            }
        }
    },

	addWebIdentity : function(domain, fingerprint, profile, hash, usage, socialplugins, browserplugins) {
        this.webidentities.push({domain : domain, fingerprint : fingerprint, profile : profile, hash : hash, usage : usage, thirdparties : [], socialplugins : socialplugins, browserplugins : browserplugins, enabled : true});
    },

    getWebIdentity : function(domain) {
        for (var i = 0; i < this.webidentities.length; i++) {
            if (this.webidentities[i].domain == domain) {
                return this.webidentities[i];
            }
        }
        return null;
    },

    getWebIdentities : function() {
        return this.webidentities;
    }
};

var privateWebIdentity = {
    privatewebidentities : [],
    
    clearPrivateWebIdentities : function() {
        this.privatewebidentities = [];
    },

    addPrivateWebIdentity : function(domain, fingerprint, profile, hash, usage, socialplugins, browserplugins) {
        this.privatewebidentities.push({domain : domain, fingerprint : fingerprint, profile : profile, hash : hash, usage : usage, thirdparties : [], socialplugins : socialplugins, browserplugins : browserplugins, enabled : true});
    },

    getPrivateWebIdentity : function(domain) {
        for (var i = 0; i < this.privatewebidentities.length; i++) {
            if (this.privatewebidentities[i].domain == domain) {
                return this.privatewebidentities[i];
            }
        }
        return null;
    },

    getPrivateWebIdentities : function() {
        return this.privatewebidentities;
    }
};
