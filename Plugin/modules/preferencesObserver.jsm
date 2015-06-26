/****************************************************************/
/* -- Fingerprint Privacy --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 06.06.2014                                             */
/****************************************************************/

var EXPORTED_SYMBOLS = ["preferencesDNTObserver"];
var EXPORTED_SYMBOLS = ["preferencesThirdPartiesObserver"]; 

var Cc = Components.classes;
var Ci = Components.interfaces;

var preferencesThirdPartiesObserver = {
  observe: function(aSubject, aTopic, aData) {
    // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
    // aData is the name of the pref that's been changed (relative to aSubject)
    switch (aData) {
      // network.cookie.cookieBehavior was changed
      case "cookieBehavior":
        var fingerprintprivacypreferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fingerprintprivacy.');
        var firefoxpreferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('network.cookie.');
        if (firefoxpreferences.getIntPref('cookieBehavior') == 1) {
          fingerprintprivacypreferences.setBoolPref('blockthirdparties', true);
        } else {
          fingerprintprivacypreferences.setBoolPref('blockthirdparties', false);
        }
        break;
    }
  },

  register: function() {
    // First we'll need the preference services to look for preferences.
    var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

    // For this.branch we ask for the preferences for network.cookie. and children
    this.branch = prefService.getBranch("network.cookie.");

    // Now we queue the interface called nsIPrefBranch2. This interface is described as:  
    // "nsIPrefBranch2 allows clients to observe changes to pref values."
    // This is only necessary prior to Gecko 13
    if (!("addObserver" in this.branch))
        this.branch.QueryInterface(Ci.nsIPrefBranch2);

    // Finally add the observer.
    this.branch.addObserver("", this, false);
  },

  unregister: function() {
    this.branch.removeObserver("", this);
  }  
};

var preferencesDNTObserver = {
  observe: function(aSubject, aTopic, aData) {
    // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
    // aData is the name of the pref that's been changed (relative to aSubject)
    switch (aData) {
      // privacy.donottrackheader.enabled was changed
      case "enabled":
        var fingerprintprivacypreferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fingerprintprivacy.');
        fingerprintprivacypreferences.setBoolPref('dntheader', !fingerprintprivacypreferences.getBoolPref('dntheader'));  
        break;
    }
  },

  register: function() {
    // First we'll need the preference services to look for preferences.
    var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

    // For this.branch we ask for the preferences for privacy.donottrackheader. and children
    this.branch = prefService.getBranch("privacy.donottrackheader.");

    // Now we queue the interface called nsIPrefBranch2. This interface is described as:  
    // "nsIPrefBranch2 allows clients to observe changes to pref values."
    // This is only necessary prior to Gecko 13
    if (!("addObserver" in this.branch))
        this.branch.QueryInterface(Ci.nsIPrefBranch2);

    // Finally add the observer.
    this.branch.addObserver("", this, false);
  },

  unregister: function() {
    this.branch.removeObserver("", this);
  }  
};
