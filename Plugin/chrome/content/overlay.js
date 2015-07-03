/****************************************************************/
/* -- FP-Block --                                               */
/* Author: Christof Ferreira Torres                             */
/* Date: 15.04.2015                                             */
/****************************************************************/

Components.utils.import("resource://lib/webIdentity.jsm");
Components.utils.import("resource://lib/detection.jsm");
Components.utils.import("resource://lib/httpRequestObserver.jsm");
Components.utils.import("resource://lib/preferencesObserver.jsm");

var Cc = Components.classes;
var Ci = Components.interfaces;

var preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fpblock.');

var fpBlock = new function() {
	var previousdomain = null;
	return {
		init : function() {
			// Install toolbar button at the first run
	    	if (preferences.getBoolPref("firstrun")) {
				// https://developer.mozilla.org/en-US/docs/Code_snippets/Toolbar
	            /**
	             * Installs the toolbar button with the given ID into the given
	             * toolbar, if it is not already present in the document.
	             *
	             * @param {string} toolbarId The ID of the toolbar to install to.
	             * @param {string} id The ID of the button to install.
	             * @param {string} afterId The ID of the element to insert after. @optional
	             */
	            function installButton(toolbarId, id, afterId) {
	                if (!document.getElementById(id)) {
	                    var toolbar = document.getElementById(toolbarId);
	             
	                    // If no afterId is given, then append the item to the toolbar
	                    var before = null;
	                    if (afterId) {
	                        let elem = document.getElementById(afterId);
	                        if (elem && elem.parentNode == toolbar)
	                            before = elem.nextElementSibling;
	                    }
	             
	                    toolbar.insertItem(id, before);
	                    toolbar.setAttribute("currentset", toolbar.currentSet);
	                    document.persist(toolbar.id, "currentset");
	             
	                    if (toolbarId == "addon-bar")
	                        toolbar.collapsed = false;
	                }
	            }
			            
			    installButton("nav-bar", "fp-block-toolbar-button");
			    // The "addon-bar" is available since Firefox 4
			    installButton("addon-bar", "fp-block-toolbar-button");
	            preferences.setBoolPref("firstrun", false);
	            // Block third-party cookies
	            var firefoxpreferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('network.cookie.');
	            firefoxpreferences.setIntPref('cookieBehavior', 1);
			}
			var loader = Cc['@mozilla.org/moz/jssubscript-loader;1'].getService(Ci.mozIJSSubScriptLoader);
			// Load jQuery 2.1.0
  			loader.loadSubScript('chrome://fpblock/content/jquery-2.1.0.min.js', this);
      		// Load web identities
      		webIdentity.loadWebIdentities();
      		// Load detections
      		detection.loadDetections();
      		// Register the HTTP request observer
			httpRequestObserver.register();
			// Register the third-party cookies preferences observer
			preferencesThirdPartiesObserver.register();
			// Register the DNT header preferences observer
			preferencesDNTObserver.register();
			// Set the block third-party cookies preference
			var cookieBehaviour = preferences.getBoolPref('blockthirdparties');
	    	var firefoxpreferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('network.cookie.');
	    	if (cookieBehaviour) {
	    		firefoxpreferences.setIntPref('cookieBehavior', 1);
	    	} else {
	    		firefoxpreferences.setIntPref('cookieBehavior', 0);
	    	}
			// Set the DNT header preference
			var enabled = preferences.getBoolPref('dntheader');
	    	var firefoxpreferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('privacy.donottrackheader.');
	    	firefoxpreferences.setBoolPref('enabled', enabled);
	    	if (enabled) {
	    		firefoxpreferences.setIntPref('value', 1);
	    	} else {
	    		firefoxpreferences.setIntPref('value', 0);
	    	}
		},

    	showPopupMenu : function() {
    		var domain = null;
    		try {
    			document.getElementById('social-plugins').style.display = 'block';
	        	document.getElementById('summary').style.display = 'block';
	        	document.getElementById('browser-plugins').style.display = 'block';
	        	document.getElementById('website-switch').style.display = 'block';
	        	document.getElementById('domain-error').style.display = 'none';

	        	// Try to get the domain name
	        	var browser = gBrowser.selectedBrowser;
	        	try {
	                var eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
	                domain = eTLDService.getBaseDomain(browser.currentURI).toLowerCase();
	            } catch(e) {
	                domain = 'localhost';
	            }
	            
	            // Try to get the web identity
	            var webID = null;
	            // Private browsing mode
	            if (browser.contentWindow && PrivateBrowsingUtils.isWindowPrivate(browser.contentWindow)) {
	        		webID = privateWebIdentity.getPrivateWebIdentity(domain);
	        		$('#private-browsing').html('<image src="chrome://fpblock/skin/private-browsing.png" tooltiptext="Private browsing is enabled" width="20" height="20"/>');
	            // Normal browsing mode
	            } else {
	            	webID = webIdentity.getWebIdentity(domain);
	        		$('#private-browsing').html('');
	            }
	            
	        	if (previousdomain != domain) {
					document.getElementById('attribute-list').style.display = 'none';
					document.getElementById('arrow-attributes').src = 'chrome://fpblock/skin/collapsed.png';
					document.getElementById('third-parties-list').style.display = 'none';
					document.getElementById('arrow-third-parties').src = 'chrome://fpblock/skin/collapsed.png';
					document.getElementById('fpblock-popup').style.height = 276 + 'px';
	        		previousdomain = domain;
	        	}
				$('#domain').html(domain);
				
				// Social Plugins
	        	try {
	        		var socialplugins = webID.socialplugins;
	        		var socialpluginstable = '<table style="margin: auto;">';
		        	socialpluginstable += '<tr>';
		        	var numberofsocialplugins = 0;
		        	for (var service in socialplugins) {
		        		if (socialplugins[service] != undefined) {
		        			numberofsocialplugins++;
			        		socialpluginstable += '<td class="plugins-logo">';
				        	if (socialplugins[service]) {
				        		socialpluginstable += '<image src="chrome://fpblock/skin/'+service+'-allowed.png" class="button" tooltiptext="'+service.charAt(0).toUpperCase()+service.slice(1)+' allowed - Click to block '+service.charAt(0).toUpperCase()+service.slice(1)+'" id="'+service+'button" onclick="fpBlock.toggleSocialPlugins(\''+service+'\');"/>';
				        	} else {
				        		socialpluginstable += '<image src="chrome://fpblock/skin/'+service+'-blocked.png" class="button" tooltiptext="'+service.charAt(0).toUpperCase()+service.slice(1)+' blocked - Click to allow '+service.charAt(0).toUpperCase()+service.slice(1)+'" id="'+service+'button" onclick="fpBlock.toggleSocialPlugins(\''+service+'\');"/>';
				        	}
				        	socialpluginstable += '</td>';
				        }
		        	}
		        	if (numberofsocialplugins == 0) {
		        		socialpluginstable += '<td class="plugins-logo" style="padding-top: 10px;"><div class="error-message">No social plugins detected</div></td>';
		        	} 
			        socialpluginstable += '</tr>';
		        	socialpluginstable += '</table>';
	        		$('#social-plugins-table').html(socialpluginstable);
	        	} catch(e) {
	        		if (preferences.getBoolPref("debuggingmode")) {
	        			$('#social-plugins-table').html('<image src="chrome://fpblock/skin/error.png" width="16" height="16" style="margin: 0px 20px 0px 20px;"/><div class="error-message">'+e+'</div>');
	        		} else {
	        			$('#social-plugins-table').html('<image src="chrome://fpblock/skin/error.png" width="16" height="16" style="margin: 0px 20px 0px 20px;"/><div class="error-message">Error while loading social plugins!</div>');
	        		}
		        }
		        
		        // Summary
	    		try {
	    			var attributes;
	    			if (detection.getDetection(domain)) {
	    				attributes = detection.getDetection(domain).attributes;
	    			} else {
	    				attributes = [];
	    			}
	    			var attributesSpoofedBlocked = 0;
	    			for (var i = 0; i < attributes.length; i++) {
	    				if (attributes[i].action == 'spoof' || attributes[i].action == 'block') {
	    					attributesSpoofedBlocked++;
	    				}
	    			}
		        	$('#detected-attributes').html(attributesSpoofedBlocked+"/"+attributes.length);
		        	
		        	var thirdparties = webID.thirdparties;
		        	var thirdpartiesBlocked = 0;
	    			for (var i = 0; i < thirdparties.length; i++) {
	    				if (!thirdparties[i].enabled) {
	    					thirdpartiesBlocked++;
	    				}
	    			}
		        	$('#detected-third-parties').html(thirdpartiesBlocked+"/"+thirdparties.length);

		        	// Detected attributes
		        	$('#attribute-list').html('');
					var serviceSurface = $(document.getElementById('attribute-list'));
	      			var serviceTemplate = $(document).find('.attribute');
	      			serviceTemplate.show();
					for (var i = 0; i < attributes.length; i++) {
						var serviceControl = serviceTemplate.clone(true);
						serviceControl.find('.attribute-label').text(attributes[i].name);
						var checkbox = serviceControl[0].getElementsByTagName('html:input')[0];
						if (attributes[i].name == 'Plugins' || attributes[i].name == 'Mime Types') {
							checkbox.disabled = true;
						}
						if (attributes[i].action == "allow") {
							checkbox.checked = true;	
						} else {
							checkbox.checked = false;
						}
						checkbox.onclick = function(checkbox, attribute) {
							if (checkbox.checked) {
								attribute.action = "allow";
							} else {
								if (attribute.name == 'App Code Name' || 
							        attribute.name == 'App Name' ||
							        attribute.name == 'App Version' ||
							        attribute.name == 'Language' ||
							        attribute.name == 'OS CPU' ||
							        attribute.name == 'Platform' ||
							        attribute.name == 'Product' ||
							        attribute.name == 'User-Agent' ||
							        attribute.name == 'Vendor' ||
							        attribute.name == 'CPU Class' ||
							        attribute.name == 'System Language' ||
							        attribute.name == 'User Language' ||
							        attribute.name == 'Screen Height' ||
							        attribute.name == 'Screen Width' ||
							        attribute.name == 'Color Depth' ||
							        attribute.name == 'Available Height' ||
							        attribute.name == 'Available Width' ||
							        attribute.name == 'Pixel Depth' ||
							        attribute.name == 'Timezone') {
									attribute.action = "spoof";
								} else {
									attribute.action = "block";
								}
							}
							content.location.reload();
	              		}.bind(null, checkbox, attributes[i]);
						serviceSurface.append(serviceControl);
					}
					serviceTemplate.hide();
					
					// Third-Parties
					$('#third-parties-list').html('');
					var serviceSurface = $(document.getElementById('third-parties-list'));
	      			var serviceTemplate = $(document).find('.third-party');
	      			serviceTemplate.show();
					for (var i = 0; i < thirdparties.length; i++) {
						var serviceControl = serviceTemplate.clone(true);
						serviceControl.find('.third-party-label').text(thirdparties[i].name);
						var checkbox = serviceControl[0].getElementsByTagName('html:input')[0];
						checkbox.checked = thirdparties[i].enabled;	
						checkbox.onclick = function(checkbox, thirdparty) {
							thirdparty.enabled = checkbox.checked;
							content.location.reload();
	              		}.bind(null, checkbox, thirdparties[i]);
						serviceSurface.append(serviceControl);
					}
					serviceTemplate.hide();
		        } catch(e) {
		        	if (preferences.getBoolPref("debuggingmode")) {
						$('#summary-list').html('<image src="chrome://fpblock/skin/error.png" width="16" height="16" style="margin-left: 90px;"/><div class="error-message" style="margin-left: 22px;">'+e+'</div>');
		        	} else {
						$('#summary-list').html('<image src="chrome://fpblock/skin/error.png" width="16" height="16" style="margin-left: 90px;"/><div class="error-message" style="margin-left: 22px;">Error while loading summary!</div>');	
		        	}
		        }

		        // Browser Plugins
		        try {
		        	var browserplugins = webID.browserplugins;
		        	var browserpluginstable = '<table style="margin: auto;">';
		        	browserpluginstable += '<tr>';
		        	var otherplugins = false;
		        	for (var i = 0; i < navigator.plugins.length; i++) {
						if (navigator.plugins[i].name.indexOf("Flash") != -1) {
			        		browserpluginstable += '<td class="plugins-logo">';
							if (browserplugins.flash) {
								browserpluginstable += '<image src="chrome://fpblock/skin/flash-allowed.png" class="button" tooltiptext="Flash Player allowed - Click to block Flash Player" id="flashbutton" onclick="fpBlock.toggleBrowserPlugins(\'flash\');"/>';
							} else {
								browserpluginstable += '<image src="chrome://fpblock/skin/flash-blocked.png" class="button" tooltiptext="Flash Player blocked - Click to allow Flash Player" id="flashbutton" onclick="fpBlock.toggleBrowserPlugins(\'flash\');"/>';
							}
				        	browserpluginstable += '</td>';
						}
						else
						if (navigator.plugins[i].name.indexOf("Silverlight") != -1) {
			        		browserpluginstable += '<td class="plugins-logo">';
							if (browserplugins.silverlight) {
								browserpluginstable += '<image src="chrome://fpblock/skin/silverlight-allowed.png" class="button" tooltiptext="Silverlight allowed - Click to block Silverlight" id="silverlightbutton" onclick="fpBlock.toggleBrowserPlugins(\'silverlight\');"/>';
							} else {
								browserpluginstable += '<image src="chrome://fpblock/skin/silverlight-blocked.png" class="button" tooltiptext="Silverlight blocked - Click to allow Silverlight" id="silverlightbutton" onclick="fpBlock.toggleBrowserPlugins(\'silverlight\');"/>';
							}
				        	browserpluginstable += '</td>';
						}
						else
						if (navigator.plugins[i].name.indexOf("VLC") != -1) {
			        		browserpluginstable += '<td class="plugins-logo">';
							if (browserplugins.vlc) {
								browserpluginstable += '<image src="chrome://fpblock/skin/vlc-allowed.png" class="button" tooltiptext="VLC Player allowed - Click to block VLC Player" id="vlcbutton" onclick="fpBlock.toggleBrowserPlugins(\'vlc\');"/>';
							} else {
								browserpluginstable += '<image src="chrome://fpblock/skin/vlc-blocked.png" class="button" tooltiptext="VLC Player blocked - Click to allow VLC Player" id="vlcbutton" onclick="fpBlock.toggleBrowserPlugins(\'vlc\');"/>';
							}
				        	browserpluginstable += '</td>';
			        	} 
			        	else
						if (navigator.plugins[i].name.indexOf("QuickTime") != -1) {
			        		browserpluginstable += '<td class="plugins-logo">';
							if (browserplugins.quicktime) {
								browserpluginstable += '<image src="chrome://fpblock/skin/quicktime-allowed.png" class="button" tooltiptext="QuickTime Player allowed - Click to block QuickTime Player" id="quicktimebutton" onclick="fpBlock.toggleBrowserPlugins(\'quicktime\');"/>';
							} else {
								browserpluginstable += '<image src="chrome://fpblock/skin/quicktime-blocked.png" class="button" tooltiptext="QuickTime Player blocked - Click to allow QuickTime Player" id="quicktimebutton" onclick="fpBlock.toggleBrowserPlugins(\'quicktime\');"/>';
							}
				        	browserpluginstable += '</td>';
						} else {
							otherplugins = true;
						}
					}
					if (otherplugins) {
						browserpluginstable += '<td class="plugins-logo">';
						if (browserplugins.other) {
							browserpluginstable += '<image src="chrome://fpblock/skin/other-allowed.png" class="button" tooltiptext="All other plugins are allowed - Click to block all other plugins" id="otherbutton" onclick="fpBlock.toggleBrowserPlugins(\'other\');"/>';
						} else {
							browserpluginstable += '<image src="chrome://fpblock/skin/other-blocked.png" class="button" tooltiptext="All other plugins are blocked - Click to allow all other plugins" id="otherbutton" onclick="fpBlock.toggleBrowserPlugins(\'other\');"/>';
						}
			        	browserpluginstable += '</td>';
					}
					if (navigator.plugins.length == 0) {
		        		browserpluginstable += '<td class="plugins-logo" style="padding-top: 10px;"><div class="error-message">No browser plugins detected</div></td>';
		        	} 
			        browserpluginstable += '</tr>';
		        	browserpluginstable += '</table>';
	        		$('#browser-plugins-table').html(browserpluginstable);
	    		} catch(e) {
	    			if (preferences.getBoolPref("debuggingmode")) {
						$('#browser-plugins-table').html('<image src="chrome://fpblock/skin/error.png" width="16" height="16" style="margin: 0px 20px 0px 20px;"/><div class="error-message">'+e+'</div>');
	    			} else {
	    				$('#browser-plugins-table').html('<image src="chrome://fpblock/skin/error.png" width="16" height="16" style="margin: 0px 20px 0px 20px;"/><div class="error-message">Error while loading browser plugins!</div>');
	    			}
	    		}

	    		document.getElementById('websiteonoffswitch').checked = webID.enabled;
	        } catch(e) {
	        	document.getElementById('social-plugins').style.display = 'none';
	        	document.getElementById('summary').style.display = 'none';
	        	document.getElementById('browser-plugins').style.display = 'none';
	        	document.getElementById('website-switch').style.display = 'none';
	        	document.getElementById('domain-error').style.display = 'block';
	        	document.getElementById('fpblock-popup').style.height = 276 + 'px';
				$('#domain').html(domain);
				if (preferences.getBoolPref("debuggingmode")) {
					$('#domain-error').html('<image src="chrome://fpblock/skin/error.png" style="margin: 0px 20px 0px 20px;"/><div>'+e+'</div>');
	        	} else {
					$('#domain-error').html('<image src="chrome://fpblock/skin/error.png" style="margin: 0px 20px 0px 20px;"/><div>FP-Block stopped working! :(</div>');
	        	}
	        }
		},

		openPreferences : function() {
			window.openDialog("chrome://fpblock/content/options.xul", "fpblock-preferences-window", "chrome, titlebar, toolbar, centerscreen, dialog=no, modal").focus();
		},

		toggleSocialPlugins : function(service) {
			var browser = gBrowser.selectedBrowser;
			var domain =  null;

			// Try to get the domain name
			try {
                var eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
                domain = eTLDService.getBaseDomain(browser.currentURI).toLowerCase();
            } catch(e) {
                domain = 'localhost';
            }
        	
        	// Try to get the social plugins
        	var socialplugins = null
        	try {
                // Private browsing mode
                if (browser.contentWindow && PrivateBrowsingUtils.isWindowPrivate(browser.contentWindow)) {
					socialplugins = privateWebIdentity.getPrivateWebIdentity(domain).socialplugins;
                // Normal browsing mode
                } else {
					socialplugins = webIdentity.getWebIdentity(domain).socialplugins;
                }
            } catch(e) {
                alert(e);
            }

        	if (socialplugins.hasOwnProperty(service)) {
        		socialplugins[service] = !socialplugins[service];
	        }
        	content.location.reload();
		},

		toggleAttributes : function() {
			var browser = gBrowser.selectedBrowser;
			var domain =  null;
			
			// Try to get the domain name
			try {
                var eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
                domain = eTLDService.getBaseDomain(browser.currentURI).toLowerCase();
            } catch(e) {
                domain = 'localhost';
            }

            // Try to get the attributes
            var attributes = null;
			try {
				attributes = detection.getDetection(domain).attributes;
			} catch(e) {
				attributes = [];
			}
	    	document.getElementById('third-parties-list').style.display = 'none';
			document.getElementById('arrow-third-parties').src = 'chrome://fpblock/skin/collapsed.png';
			if (document.getElementById('attribute-list').style.display == 'block') {
				document.getElementById('attribute-list').style.display = 'none';
				document.getElementById('arrow-attributes').src = 'chrome://fpblock/skin/collapsed.png';
				document.getElementById('fpblock-popup').style.height = 276 + 'px';
			} else {
				document.getElementById('attribute-list').style.display = 'block';
				document.getElementById('arrow-attributes').src = 'chrome://fpblock/skin/expanded.png';
				document.getElementById('fpblock-popup').style.height = 276 + 21 * attributes.length + 'px';
			}
		},

		toggleThirdParties : function() {
			var browser = gBrowser.selectedBrowser;
			var domain =  null;
			
			// Try to get the domain name
			try {
                var eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
                domain = eTLDService.getBaseDomain(browser.currentURI).toLowerCase();
            } catch(e) {
                domain = 'localhost';
            }

            // Try to get the third parties
            var thirdparties = null;
            try {
                // Private browsing mode
                if (browser.contentWindow && PrivateBrowsingUtils.isWindowPrivate(browser.contentWindow)) {
                	thirdparties = privateWebIdentity.getPrivateWebIdentity(domain).thirdparties;
                // Normal browsing mode
                } else {
                	thirdparties = webIdentity.getWebIdentity(domain).thirdparties;
                }
            } catch(e) {
                alert(e);
            }

			document.getElementById('attribute-list').style.display = 'none';
			document.getElementById('arrow-attributes').src = 'chrome://fpblock/skin/collapsed.png';
			if (document.getElementById('third-parties-list').style.display == 'block') {
				document.getElementById('third-parties-list').style.display = 'none';
				document.getElementById('arrow-third-parties').src = 'chrome://fpblock/skin/collapsed.png';
				document.getElementById('fpblock-popup').style.height = 276 + 'px';
			} else {
				document.getElementById('third-parties-list').style.display = 'block';
				document.getElementById('arrow-third-parties').src = 'chrome://fpblock/skin/expanded.png';
				document.getElementById('fpblock-popup').style.height = 276 + 21 * thirdparties.length + 'px';
			}
		},

		toggleBrowserPlugins : function(plugin) {
			var browser = gBrowser.selectedBrowser;
			var domain =  null;
			
			// Try to get the domain name 
			try {
                var eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
                domain = eTLDService.getBaseDomain(browser.currentURI).toLowerCase();
            } catch(e) {
                domain = 'localhost';
            }

            // Try to get the browser plugins
            var browserplugins = null;
            try {
                // Private browsing mode
                if (browser.contentWindow && PrivateBrowsingUtils.isWindowPrivate(browser.contentWindow)) {
					browserplugins = privateWebIdentity.getPrivateWebIdentity(domain).browserplugins;
                // Normal browsing mode
                } else {
					browserplugins = webIdentity.getWebIdentity(domain).browserplugins;
                }
            } catch(e) {
                alert(e);
            }

			if (browserplugins.hasOwnProperty(plugin)) {
        		browserplugins[plugin] = !browserplugins[plugin];
	        }
        	content.location.reload();
		},

		toggleWebsite : function() {
			var browser = gBrowser.selectedBrowser;
			var domain =  null;
			
			// Try to get the domain name
			try {
                var eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
                domain = eTLDService.getBaseDomain(browser.currentURI).toLowerCase();
            } catch(e) {
                domain = 'localhost';
            }

            // Try to enable/disable the website
            try {
                // Private browsing mode
                if (browser.contentWindow && PrivateBrowsingUtils.isWindowPrivate(browser.contentWindow)) {
					privateWebIdentity.getPrivateWebIdentity(domain).enabled = !privateWebIdentity.getPrivateWebIdentity(domain).enabled;
                // Normal browsing mode
                } else {
					webIdentity.getWebIdentity(domain).enabled = !webIdentity.getWebIdentity(domain).enabled;
                }
            } catch(e) {
                alert(e);
            }       
        	content.location.reload();
		},

		detectionListener : function(event) {
			var preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fpblock.');
			var attribute = event.target.getAttribute("attribute").split(":");
			var dtn = detection.getDetection(attribute[0]);
			if (dtn == null) {
				var attributes = [];
				var canvas = {detected : false, colors: 0, width : 0, height: 0, format : null}
				if (attribute[1] == 'App Code Name' || 
					attribute[1] == 'App Name' ||
					attribute[1] == 'App Version' ||
					attribute[1] == 'Language' ||
					attribute[1] == 'OS CPU' ||
					attribute[1] == 'Platform' ||
					attribute[1] == 'Product' ||
					attribute[1] == 'User-Agent' ||
					attribute[1] == 'Vendor' ||
					attribute[1] == 'CPU Class' ||
					attribute[1] == 'System Language' ||
					attribute[1] == 'User Language' ||
					attribute[1] == 'Screen Height' ||
					attribute[1] == 'Screen Width' ||
					attribute[1] == 'Color Depth' ||
					attribute[1] == 'Available Height' ||
					attribute[1] == 'Available Width' ||
					attribute[1] == 'Pixel Depth' ||
					attribute[1] == 'Timezone') {
					attributes.push({name : attribute[1], action : "spoof"});
				} else {
					if (attribute[1].indexOf("Canvas To Data URL") > -1) {
						var properties = attribute[1].split(" - ")[1].split(", ");
						canvas.colors = properties[0];
						canvas.width  = properties[1];
						canvas.height = properties[2];
						canvas.format = properties[3];
						if (properties[4] != "null") canvas.data = properties[4];
						attributes.push({name : "Canvas To Data URL", action : "block"});
					} else {
						attributes.push({name : attribute[1], action : "block"});
					}
				}
				detection.addDetection(attribute[0], attributes, false, canvas);
			} else {
				var attributes = dtn.attributes;
				for (var i = 0; i < attributes.length; i++) {
					if (attribute[1].indexOf(attributes[i].name) > -1) {
						if (!dtn.notified && preferences.getBoolPref('notifydetections')) {
							fpBlock.detectionNotification(attribute[0]);
						}
						return;
			        }
		        }
		        if (attribute[1] == 'App Code Name' || 
					attribute[1] == 'App Name' ||
					attribute[1] == 'App Version' ||
					attribute[1] == 'Language' ||
					attribute[1] == 'OS CPU' ||
					attribute[1] == 'Platform' ||
					attribute[1] == 'Product' ||
					attribute[1] == 'User-Agent' ||
					attribute[1] == 'Vendor' ||
					attribute[1] == 'CPU Class' ||
					attribute[1] == 'System Language' ||
					attribute[1] == 'User Language' ||
					attribute[1] == 'Screen Height' ||
					attribute[1] == 'Screen Width' ||
					attribute[1] == 'Color Depth' ||
					attribute[1] == 'Available Height' ||
					attribute[1] == 'Available Width' ||
					attribute[1] == 'Pixel Depth' ||
					attribute[1] == 'Timezone') {
					attributes.push({name : attribute[1], action : "spoof"});
				} else {
					if (attribute[1].indexOf("Canvas To Data URL") > -1) {
						var properties = attribute[1].split(" - ")[1].split(", ");
						dtn.canvas.colors = properties[0];
						dtn.canvas.width  = properties[1];
						dtn.canvas.height = properties[2];
						dtn.canvas.format = properties[3];
						if (properties[4] != "null") dtn.canvas.data = properties[4];
						attributes.push({name : "Canvas To Data URL", action : "block"});
					} else {
						attributes.push({name : attribute[1], action : "block"});
					}
				}
		        dtn.notified = false;
		        // Canvas Fingerprinting detection algorithm
				// -----------------------------------------
				if (!dtn.canvas.detected) {
					// 1. There should be both ToDataURL and fillText (or strokeText)
					// method calls and both calls should come from the same URL.
					for (var i = 0; i < dtn.attributes.length; i++) {
						if (dtn.attributes[i].name == 'Canvas To Data URL') {
							for (var j = 0; j < dtn.attributes.length; j++) {
								if (dtn.attributes[j].name == 'Canvas Fill Text' || dtn.attributes[j].name == 'Canvas Stroke Text') {
									// 2. The canvas image(s) read by the script should contain more than one color and 
									// its(their) aggregate size should be greater than 16x16 pixels.
									if (dtn.canvas.colors > 1 && dtn.canvas.width > 16 && dtn.canvas.height > 16) {
										// 3. The image should not be requested in a lossy compression format such as JPEG.
										if (dtn.canvas.format == "null") {
											dtn.canvas.detected = true;
											var params = {url : attribute[0]};
											window.openDialog("chrome://fpblock/content/canvasFingerprinting.xul", "", "chrome, centerscreen, modal", params).focus();
										}	
									}
								}
							}
						}
					}
				}
			}
			if (preferences.getBoolPref('notifydetections')) {
				fpBlock.detectionNotification(attribute[0]);
			}
		},

		detectionNotification : function(url) {
			var attributes = detection.getDetection(url).attributes;
			var attributeNames = [];
			for (var i = 0; i < attributes.length; i++) {
				attributeNames.push(attributes[i].name);
			}
			var message = "FP-Block prevented "+url+" from reading the following attributes: "+attributeNames.join(", ");
			var notificationBox = gBrowser.getNotificationBox();
			var notification = notificationBox.getNotificationWithValue('fingerprinting-blocked');
			if (notification) {
			    notification.label = message;
			} else {
			    var buttons = [{
			        label: 'Allow',
			        accessKey: 'A',
			        callback: function() {
			        	var params = {url : url};
			            window.openDialog("chrome://fpblock/content/webidentities.xul", "", "chrome, titlebar, toolbar, centerscreen, dialog=no, modal, resizable=yes", params).focus();
			        	detection.getDetection(url).notified = true;
			        }
			    },
			    {
			        label: 'Keep blocking',
			        accessKey: 'B',
			        callback: function() {
			        	detection.getDetection(url).notified = true;
			        }
			    }];
			    const priority = notificationBox.PRIORITY_WARNING_MEDIUM;
			    notificationBox.appendNotification(message, 'fingerprinting-blocked', 'chrome://browser/skin/Info.png', priority, buttons);
			}
		},

		shutdown : function() {
			// Clear private web identities
			privateWebIdentity.clearPrivateWebIdentities();
		    // Save detections
      		detection.saveDetections();
	        // Save web identities
      		webIdentity.saveWebIdentities();
			// Unregister the HTTP Request Observer
		    httpRequestObserver.unregister();
		    // Unregister the third-party cookies preferences observer
			preferencesThirdPartiesObserver.unregister();
			// Unregister the DNT header preferences observer
			preferencesDNTObserver.unregister();
		}
	};
}();

window.addEventListener("load", fpBlock.init, false);
window.addEventListener("unload", fpBlock.shutdown, false);

var mainWindow = window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsIDocShellTreeItem).rootTreeItem.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
mainWindow.document.addEventListener("DetectionEvent", function(event) { fpBlock.detectionListener(event); }, false, true);
