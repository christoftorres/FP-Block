/****************************************************************/
/* -- Fingerprint Privacy --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 02.02.2015                                             */
/****************************************************************/

Components.utils.import("resource://modules/webIdentity.jsm");
Components.utils.import("resource://modules/detection.jsm");
Components.utils.import("resource://modules/randomFingerprintGenerator.jsm");

// Called once when the dialog displays
function onLoad() {
  if (window.arguments != null) {
    // Get web identity
    var webID = webIdentity.getWebIdentity(window.arguments[0].url);
    // Get attribute
    var attribute = detection.getAttribute(window.arguments[0].url, window.arguments[0].name);
    // Set the domain name
    document.getElementById('domain-name').value = "Domain: "+webID.domain;
    // Set the attribute name
    document.getElementById('attribute-name').value = attribute.name; 
    // Set the attribute action
    document.getElementById('attribute-action').value = attribute.action;

    document.getElementById('attribute-action').getItemAtIndex(1).hidden = false;
    document.getElementById('attribute-label-value').hidden = true;
    document.getElementById('attribute-value').hidden = true;
    
    if (attribute.name == 'App Code Name') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.appCodeName;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'App Name') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.appName;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'App Version') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.appVersion;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Language') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.language;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'OS CPU') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.oscpu;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Platform') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.platform;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Product') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.product;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'User-Agent') {
      document.getElementById('attribute-value').value = webID.fingerprint.useragent;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Vendor') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.vendor;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'CPU Class') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.cpuClass;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'System Language') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.systemLanguage;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'User Language') {
      document.getElementById('attribute-value').value = webID.fingerprint.navigator.userLanguage;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Screen Height') {
      document.getElementById('attribute-value').value = webID.fingerprint.screen.height;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Screen Width') {
      document.getElementById('attribute-value').value = webID.fingerprint.screen.width;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Color Depth') {
      document.getElementById('attribute-value').value = webID.fingerprint.screen.colorDepth;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Available Height') {
      document.getElementById('attribute-value').value = webID.fingerprint.screen.availHeight;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Available Width') {
      document.getElementById('attribute-value').value = webID.fingerprint.screen.availWidth;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Pixel Depth') {
      document.getElementById('attribute-value').value = webID.fingerprint.screen.pixelDepth;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else
    if (attribute.name == 'Timezone') {
      document.getElementById('attribute-value').value = webID.fingerprint.date.timezoneOffset;
      document.getElementById('attribute-label-value').hidden = false;
      document.getElementById('attribute-value').hidden = false;
    } else {
      document.getElementById('attribute-action').getItemAtIndex(1).hidden = true;
    }
  }
}

function actionSelected() {
  // Enable respectively disable the attribute value if the seleted action is 'spoof' 
  if (document.getElementById('attribute-action').value == 'spoof') {
    document.getElementById('attribute-value').disabled = false;
  } else {
    document.getElementById('attribute-value').disabled = true;
  }
}

function acceptEdit() {
  // Display warning
  alert('Warning: Modifying the value of an attribute can break consistency!');  
  // Get web identity
  var webID = webIdentity.getWebIdentity(window.arguments[0].url);
  // Get attribute
  var attribute = detection.getAttribute(window.arguments[0].url, window.arguments[0].name);
  // Save the attribute action
  attribute.action = document.getElementById('attribute-action').value;
  // Save the edited attribute
  if (document.getElementById('attribute-action').value == 'spoof') {
    if (attribute.name == 'App Code Name') {
      webID.fingerprint.navigator.appCodeName = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'App Name') {
      webID.fingerprint.navigator.appName = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'App Version') {
      webID.fingerprint.navigator.appVersion = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Language') {
      webID.fingerprint.navigator.language = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'OS CPU') {
      webID.fingerprint.navigator.oscpu = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Platform') {
      webID.fingerprint.navigator.platform = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Product') {
      webID.fingerprint.navigator.product = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'User-Agent') {
      webID.fingerprint.useragent = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Vendor') {
      webID.fingerprint.navigator.vendor = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'CPU Class') {
      webID.fingerprint.navigator.cpuClass = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'System Language') {
      webID.fingerprint.navigator.systemLanguage = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'User Language') {
      webID.fingerprint.navigator.userLanguage = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Screen Height') {
      webID.fingerprint.screen.height = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Screen Width') {
      webID.fingerprint.screen.width = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Color Depth') {
      webID.fingerprint.screen.colorDepth = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Available Height') {
      webID.fingerprint.screen.availHeight = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Available Width') {
      webID.fingerprint.screen.availWidth = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Pixel Depth') {
      webID.fingerprint.screen.pixelDepth = document.getElementById('attribute-value').value;
    } else
    if (attribute.name == 'Timezone') {
      webID.fingerprint.date.timezoneOffset = document.getElementById('attribute-value').value;
    }
  }
  // Save the new generated hash
  webID.hash = randomFingerprintGenerator.generateHash(webID.fingerprint);
}
