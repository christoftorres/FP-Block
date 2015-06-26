/****************************************************************/
/* -- Fingerprint Privacy --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 16.09.2014                                             */
/****************************************************************/

var EXPORTED_SYMBOLS = ["detection"]; 

var Cc = Components.classes;
var Ci = Components.interfaces;

var detection = {
	detections : [],

    loadDetections : function() {
        var preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fingerprintprivacy.');
        this.detections = JSON.parse(preferences.getCharPref('detections'));
    },

    saveDetections : function() {
        var preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fingerprintprivacy.');
        preferences.setCharPref('detections', JSON.stringify(this.detections));
    },

    clearDetections : function() {
    	this.detections = [];
    },

    deleteDetection : function(url) {
        for (var i = 0; i < this.detections.length; i++) {
            if (this.detections[i].url.indexOf(url) != -1) {
                this.detections.splice(i,1);
                return;
            }
        }
    },

    deleteAttribute : function(url, name) {
        for (var i = 0; i < this.detections.length; i++) {
            if (this.detections[i].url.indexOf(url) != -1) {
                for (var j = 0; j < this.detections[i].attributes.length; j++) {
                    if (this.detections[i].attributes[j].name.indexOf(name) != -1) {
                        this.detections[i].attributes.splice(j,1);
                        return;
                    }
                }
            }
        }
    },
    
	addDetection : function(url, attributes, notified, canvas) {
		this.detections.push({url : url, attributes : attributes, notified : notified, canvas : canvas});
	},

	getDetection : function(url) {
		for (var i = 0; i < this.detections.length; i++) {
			if (this.detections[i].url.indexOf(url) != -1) {
				return this.detections[i];
			}	
		}
        return null;
	},

    getAttribute : function(url, name) {
        for (var i = 0; i < this.detections.length; i++) {
            if (this.detections[i].url.indexOf(url) != -1) {
                for (var j = 0; j < this.detections[i].attributes.length; j++) {
                    if (this.detections[i].attributes[j].name.indexOf(name) != -1) {
                        return this.detections[i].attributes[j];
                    }
                }
            }   
        }
        return null;
    },

	getAllDetections : function() {
        return this.detections;
    }
};
