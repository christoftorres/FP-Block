/****************************************************************/
/* -- FP-Block --                                               */
/* Author: Christof Ferreira Torres                             */
/* Date: 26.08.2015                                             */
/****************************************************************/

window.onload = function() {
	getAddonNameVer(function(addon) {
    document.getElementById('version').value = addon.name + " " + addon.version;
        var fpblockpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.fpblock.');
        if (fpblockpreferences.getCharPref('latestfetch') == '') {
        	document.getElementById('latest-fetch').value = "Last time fetched: never";
        } else {
        	var latestfetch = new Date(parseInt(fpblockpreferences.getCharPref('latestfetch')));
			var day = (String(latestfetch.getDate()).length == 1) ? "0" + latestfetch.getDate() : latestfetch.getDate();
			var month = (String(latestfetch.getMonth() + 1).length == 1) ? "0" + (latestfetch.getMonth() + 1) : latestfetch.getMonth() + 1;
			var year = latestfetch.getFullYear();
			var hour = (String(latestfetch.getHours()).length == 1) ? "0" + latestfetch.getHours() : latestfetch.getHours();
			var minutes = (String(latestfetch.getMinutes()).length == 1) ? "0" + latestfetch.getMinutes() : latestfetch.getMinutes();
			var seconds = (String(latestfetch.getSeconds()).length == 1) ? "0" + latestfetch.getSeconds() : latestfetch.getSeconds();
			document.getElementById('latest-fetch').value = "Last time fetched: " + day + "/" + month + "/" + year + " " + hour + ":" + minutes + ":" + seconds;
        }
    });
};

function getAddonNameVer(callback) {
    Components.utils.import("resource://gre/modules/AddonManager.jsm");
    AddonManager.getAddonByID('fpblock@fingerprint.christoftorres.com', callback);
}

function blockThirdParties() {
	var fpblockpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.fpblock.');
	var cookieBehaviour = !fpblockpreferences.getBoolPref('blockthirdparties');
	var firefoxpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('network.cookie.');
	if (cookieBehaviour) {
		firefoxpreferences.setIntPref('cookieBehavior', 1);
	} else {
		firefoxpreferences.setIntPref('cookieBehavior', 0);
	}
}

function setDNTHeader() {
	var fpblockpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.fpblock.');
	var enabled = !fpblockpreferences.getBoolPref('dntheader');
	var firefoxpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('privacy.donottrackheader.');
	firefoxpreferences.setBoolPref('enabled', enabled);
	if (enabled) {
		firefoxpreferences.setIntPref('value', 1);
	} else {
		firefoxpreferences.setIntPref('value', 0);
	}
}

function blockAutomaticConnections() {
	var fpblockpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.fpblock.');
	var enabled = !fpblockpreferences.getBoolPref('autoblockconnections');
	// Page preloading
	var firefoxpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('network.http.');
	if (enabled) {
		firefoxpreferences.setIntPref('speculative-parallel-limit', 0);
	} else {
		firefoxpreferences.setIntPref('speculative-parallel-limit', 6);
	}
	// DNS prefetching
	firefoxpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('network.dns.');
	if (enabled) {
		firefoxpreferences.setBoolPref('disablePrefetch', true);
	} else {
		firefoxpreferences.setBoolPref('disablePrefetch', false);
	}
	// Link prefetching
	firefoxpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('network.');
	if (enabled) {
		firefoxpreferences.setBoolPref('prefetch-next', false);
	} else {
		firefoxpreferences.setBoolPref('prefetch-next', true);
	}
}

function resetDefaultSettings() {
	var fpblockpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.fpblock.');
	// General preferences
	fpblockpreferences.setBoolPref('notifydetections', true);
	// HTTP preferences
	fpblockpreferences.setBoolPref('blockthirdparties', true);
	//fpblockpreferences.setBoolPref('deletereferer', true);
	fpblockpreferences.setBoolPref('dntheader', true);
	fpblockpreferences.setBoolPref('deleteetags', true);
	// JavaScript preferences
	fpblockpreferences.setBoolPref('autoblocksocial', false);
	fpblockpreferences.setBoolPref('autoblockplugins', true);
	// Firefox automatic connections preferences
	fpblockpreferences.setBoolPref('autoblockconnections', true);
	// Debugging mode
	fpblockpreferences.setBoolPref('debuggingmode', false);

	var firefoxpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('network.cookie.');
	firefoxpreferences.setIntPref('cookieBehavior', 1);
	firefoxpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('privacy.donottrackheader.');
	firefoxpreferences.setBoolPref('enabled', true);
	firefoxpreferences.setIntPref('value', 1);
	firefoxpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('network.http.');
	firefoxpreferences.setIntPref('speculative-parallel-limit', 0);
	firefoxpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('network.dns.');
	firefoxpreferences.setBoolPref('disablePrefetch', true);
	firefoxpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('network.');
	firefoxpreferences.setBoolPref('prefetch-next', false);
}

Components.utils.import("resource://modules/profiles.jsm");

function fetchLatestProfiles() {
	var loader = document.getElementById('ajax-loader');
	loader.style.visibility = 'visible';
	var path    = "http://christoftorres.no-ip.org/Experiments/profiles/";  
	var files   = ["chrome.json", "firefox.json", "opera.json", "safari.json"];
	var xmlhttp = new XMLHttpRequest();
	var index   = 0;
	profiles    = [];
	xmlhttp.onreadystatechange = function() {
    	if (xmlhttp.readyState == 4) {
    		if (xmlhttp.status == 200) {
    			profiles.push(JSON.parse(xmlhttp.responseText));
      			index++;
      			if (index != files.length) {
        			xmlhttp.open("POST", path+files[index], true);
        			xmlhttp.send();
      			} else {
      				var fpblockpreferences = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.fpblock.');
	    			fpblockpreferences.setCharPref('latestfetch', new Date().getTime());
	    			var latestfetch = new Date(parseInt(fpblockpreferences.getCharPref('latestfetch')));
	    			var day = (String(latestfetch.getDate()).length == 1) ? "0" + latestfetch.getDate() : latestfetch.getDate();
	    			var month = (String(latestfetch.getMonth() + 1).length == 1) ? "0" + (latestfetch.getMonth() + 1) : latestfetch.getMonth() + 1;
	    			var year = latestfetch.getFullYear();
					var hour = (String(latestfetch.getHours()).length == 1) ? "0" + latestfetch.getHours() : latestfetch.getHours();
					var minutes = (String(latestfetch.getMinutes()).length == 1) ? "0" + latestfetch.getMinutes() : latestfetch.getMinutes();
	    			var seconds = (String(latestfetch.getSeconds()).length == 1) ? "0" + latestfetch.getSeconds() : latestfetch.getSeconds();
	    			document.getElementById('latest-fetch').value = "Last time fetched: " + day + "/" + month + "/" + year + " " + hour + ":" + minutes + ":" + seconds;
        			loader.style.visibility = 'hidden';
      			}
      		}	
    	}
	}
	xmlhttp.open("POST", path+files[index], true);
  	xmlhttp.send();
}