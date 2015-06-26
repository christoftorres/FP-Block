/****************************************************************/
/* -- Fingerprint Privacy --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 14.12.2014                                             */
/****************************************************************/

Components.utils.import("resource://gre/modules/AddonManager.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");

var EXPORTED_SYMBOLS = ["profiles"]; 

var profiles = [];

AddonManager.getAddonByID("fingerprintprivacy@fingerprint.christoftorres.com", function(addon) {
	var uri = addon.getResourceURI("/profiles");
	if (uri instanceof Components.interfaces.nsIFileURL) {
		var entries = uri.file.directoryEntries;
		while(entries.hasMoreElements()) {
			var entry = entries.getNext();
  			entry.QueryInterface(Components.interfaces.nsIFile);
  			var channel = NetUtil.newChannel(entry);
			channel.contentType = "application/json";
			NetUtil.asyncFetch(channel, function(inputStream, status) {
				if (!Components.isSuccessCode(status)) {
			    	// Handle error!
		        	Components.utils.reportError("Error fetching profile!");
			    	return;
			  	}
			  	// The file data is contained within inputStream.
			  	// You can read it into a string with
			  	var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
			  	// Parse the JSON file into an object and add it to the profiles
		    	profiles.push(JSON.parse(data));
			});
		}
  	}
});
