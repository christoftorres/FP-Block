/****************************************************************/
/* -- Fingerprint Privacy --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 13.02.2015                                             */
/****************************************************************/

Components.utils.import("resource://modules/webIdentity.jsm");
Components.utils.import("resource://modules/detection.jsm");
Components.utils.import("resource://modules/randomFingerprintGenerator.jsm");

var Cc = Components.classes;
var Ci = Components.interfaces;

var preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fingerprintprivacy.');

var nrOfWebIdentities;

function generateWebIdentities() {
  clearWebIdentities();
  var start = new Date().getTime();
  for (var i = 1; i <= preferences.getIntPref('webidentitieslimit'); i++) {
    var socialplugins = {facebook : undefined, twitter : undefined , googleplus : undefined, linkedin : undefined, tumblr : undefined, pinterest : undefined};
    var browserplugins = {flash : false, silverlight : false, vlc : false, quicktime : false, other : false};
    var generatedFingerprint = randomFingerprintGenerator.generateAndCheckUniqueness(webIdentity.getWebIdentities());
    webIdentity.addWebIdentity('test'+i+'.com', generatedFingerprint.fingerprint, generatedFingerprint.profile, generatedFingerprint.hash, generatedFingerprint.usage, socialplugins, browserplugins);
    document.getElementById("number-of-generations").innerHTML = webIdentity.getWebIdentities().length+"/"+preferences.getIntPref('webidentitieslimit');
  }
  var stop = new Date().getTime();
  var elapsed = stop - start;
  document.getElementById("number-of-generations").innerHTML += " " + elapsed + "ms";
}

// Called once when the dialog displays
function onLoad() {
  // Get the tree
  var tree = document.getElementById("webIdentitiesTree");
  // Get the children of the tree
  var treeChildren = document.getElementById("webIdentitiesTreeChildren");
  // Sort the web identities alphabeticaly prior to the domain
  var webIDs = webIdentity.getWebIdentities().sort(function compare(a,b) {
    if (a.domain < b.domain)
       return -1;
    if (a.domain > b.domain)
      return 1;
    return 0;
  });
  nrOfWebIdentities = 0;
  // For each web identity...
  for (var i = 0; i < webIDs.length; i++) {
    try {
      var attributes = detection.getDetection(webIDs[i].domain).attributes;  
      var item = document.createElement('treeitem');
      item.setAttribute('container', 'true');
      if (window.arguments != null && window.arguments[0].url.indexOf(webIDs[i].domain) != -1) {
        tree.view.selection.select(i);
        item.setAttribute('open', 'true');
      }
      var row = document.createElement('treerow');
      var cell = document.createElement('treecell');
      // Add the domain name to the tree
      cell.setAttribute('label', webIDs[i].domain);
      row.appendChild(cell);
      item.appendChild(row);
      var children = document.createElement('treechildren');
      // For each attribute of the web identity...
      for (var j = 0; j < attributes.length; j++) {
        var innerItem = document.createElement('treeitem');
        var innerRow = document.createElement('treerow');
        var innerCell = document.createElement('treecell');
        // Add the attribute name to the tree
        innerCell.setAttribute('label', attributes[j].name);
        innerRow.appendChild(innerCell);
        innerCell = document.createElement('treecell');
        // Add the attribute value to the tree
        if (attributes[j].name == 'App Code Name') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.appCodeName);  
        } else
        if (attributes[j].name == 'App Name') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.appName);  
        } else
        if (attributes[j].name == 'App Version') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.appVersion);  
        } else
        if (attributes[j].name == 'Language') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.language);  
        } else
        if (attributes[j].name == 'OS CPU') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.oscpu);  
        } else
        if (attributes[j].name == 'Platform') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.platform);  
        } else
        if (attributes[j].name == 'Product') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.product);  
        } else
        if (attributes[j].name == 'User-Agent') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.useragent);  
        } else
        if (attributes[j].name == 'Vendor') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.vendor);  
        } else
        if (attributes[j].name == 'CPU Class') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.cpuClass);  
        } else
        if (attributes[j].name == 'System Language') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.systemLanguage);  
        } else
        if (attributes[j].name == 'User Language') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.navigator.userLanguage);  
        } else
        if (attributes[j].name == 'Screen Height') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.screen.height);  
        } else
        if (attributes[j].name == 'Screen Width') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.screen.width);  
        } else
        if (attributes[j].name == 'Color Depth') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.screen.colorDepth);  
        } else
        if (attributes[j].name == 'Available Height') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.screen.availHeight);  
        } else
        if (attributes[j].name == 'Available Width') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.screen.availWidth);  
        } else
        if (attributes[j].name == 'Pixel Depth') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.screen.pixelDepth);  
        } else
        if (attributes[j].name == 'Timezone') {
          innerCell.setAttribute('label', webIDs[i].fingerprint.date.timezoneOffset);  
        }
        innerRow.appendChild(innerCell);
        innerCell = document.createElement('treecell');
        // Add the attribute action to the tree
        if (attributes[j].name != 'Plugins' && attributes[j].name != 'Mime Types') {
          if (attributes[j].action == 'spoof') {
            innerCell.setAttribute('src', 'chrome://fingerprintprivacy/skin/spoof.png');
            innerCell.setAttribute('label', ' Spoof');
          } else 
          if (attributes[j].action == 'block') {
            innerCell.setAttribute('src', 'chrome://fingerprintprivacy/skin/block.png');
            innerCell.setAttribute('label', ' Block');
          } else {
            innerCell.setAttribute('src', 'chrome://fingerprintprivacy/skin/allow.png');
            innerCell.setAttribute('label', ' Allow');
          }
        }
        innerRow.appendChild(innerCell);
        innerItem.appendChild(innerRow);
        children.appendChild(innerItem);
      }
      item.appendChild(children);
      treeChildren.appendChild(item);
      nrOfWebIdentities++;
    } catch(e) {
      
    }
  }
  document.getElementById("number-of-web-identities").innerHTML = "Number of web identities: "+nrOfWebIdentities;
  if (preferences.getBoolPref('debuggingmode')) {
    document.getElementById("number-of-web-identities").innerHTML += "<span style='color:gray'>/"+webIDs.length+"</span>";
  }
}

function clearWebIdentities() {
  // Delete all the detected attributes
  detection.clearDetections();
  // Delete all the created web identities
  webIdentity.clearWebIdentities();
  // Update the tree
  var treeChildren = document.getElementById("webIdentitiesTreeChildren");
  while (treeChildren.lastChild) {
    treeChildren.removeChild(treeChildren.lastChild);
  }
  // Update the number of web identities
  nrOfWebIdentities = 0;
  document.getElementById("number-of-web-identities").innerHTML = "Number of web identities: "+nrOfWebIdentities;
  if (preferences.getBoolPref('debuggingmode')) {
    document.getElementById("number-of-web-identities").innerHTML += "<span style='color:gray'>/"+webIdentity.getWebIdentities().length+"</span>";
  }
}

function showPopup() {
  // Get the tree
  var tree = document.getElementById("webIdentitiesTree");
  // Get the name of the selected web identity or attribute
  var cellText = tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(0));
  // Set the context menu for Plugins or Mime Types
  if (cellText == 'Plugins' || cellText == 'Mime Types') {
    document.getElementById('third-parties').hidden = true;
    document.getElementById('edit').hidden = true;
    document.getElementById('delete').label = "Delete Attribute";
    document.getElementById('regenerate').hidden = true;
    // Debugging mode
    document.getElementById('hash').hidden = true;
    document.getElementById('usage-amount').hidden = true;
    document.getElementById('usage-date').hidden = true;
  } else
  // Set the context menu for a web identity
  if (cellText.indexOf('.') != -1 || cellText == 'localhost') {
    document.getElementById('third-parties').hidden = false;
    document.getElementById('edit').hidden = true;
    document.getElementById('delete').label = "Delete Web Identity";
    document.getElementById('regenerate').hidden = false;
    document.getElementById('regenerate').label = "Regenerate Web Identity";
    // Debugging mode
    if (preferences.getBoolPref('debuggingmode')) {
      document.getElementById('hash').hidden = false;
      document.getElementById('hash').label = "Hash: "+webIdentity.getWebIdentity(cellText).hash;
      document.getElementById('usage-amount').hidden = false;
      document.getElementById('usage-amount').label = "Usage amount: "+webIdentity.getWebIdentity(cellText).usage.amount;
      document.getElementById('usage-date').hidden = false;
      document.getElementById('usage-date').label = "Usage date: "+new Date(webIdentity.getWebIdentity(cellText).usage.date).toUTCString();
    } else {
      document.getElementById('hash').hidden = true;
      document.getElementById('usage-amount').hidden = true;
      document.getElementById('usage-date').hidden = true;
    }
  // Set the context menu for the remaining attributes
  } else {
    document.getElementById('third-parties').hidden = true;
    document.getElementById('edit').hidden = false;
    document.getElementById('delete').label = "Delete Attribute";
    if (cellText == 'App Code Name' || 
        cellText == 'App Name' ||
        cellText == 'App Version' ||
        cellText == 'Language' ||
        cellText == 'OS CPU' ||
        cellText == 'Platform' ||
        cellText == 'Product' ||
        cellText == 'User-Agent' ||
        cellText == 'Vendor' ||
        cellText == 'CPU Class' ||
        cellText == 'System Language' ||
        cellText == 'User Language' ||
        cellText == 'Screen Height' ||
        cellText == 'Screen Width' ||
        cellText == 'Color Depth' ||
        cellText == 'Available Height' ||
        cellText == 'Available Width' ||
        cellText == 'Pixel Depth' ||
        cellText == 'Timezone') {
      document.getElementById('regenerate').hidden = false;
      document.getElementById('regenerate').label = "Regenerate Attribute";
    } else {
      document.getElementById('regenerate').hidden = true;
    }
    // Debugging mode
    document.getElementById('hash').hidden = true;
    document.getElementById('usage-amount').hidden = true;
    document.getElementById('usage-date').hidden = true;
  }
}

function viewThirdParties() {
  // Get the tree
  var tree = document.getElementById("webIdentitiesTree");
  // Get the selected index
  var currentIndex = tree.currentIndex;
  // Get the domain name of the selected index
  var domain = tree.view.getCellText(currentIndex, tree.columns.getColumnAt(0));
  // Set the domain as a parameter for the third-parties window
  var params = {domain : domain};
  // Call the third-parties window
  window.openDialog("chrome://fingerprintprivacy/content/thirdparties.xul", "", "chrome, titlebar, toolbar, centerscreen, dialog=no, modal, resizable=yes", params).focus();
}

function editAttribute() {
  // Get the tree
  var tree = document.getElementById("webIdentitiesTree");
  // Get the selected index
  var currentIndex = tree.currentIndex;
  // Get the attribute name
  var name = tree.view.getCellText(currentIndex, tree.columns.getColumnAt(0));
  // Get the domain name
  var url = tree.view.getCellText(tree.view.getParentIndex(currentIndex), tree.columns.getColumnAt(0));
  // Set the domain name and the attribute name as parameters for the edit attribute window
  var params = {url : url, name : name};
  // Call the edit attribute window
  window.openDialog("chrome://fingerprintprivacy/content/attribute.xul", "", "chrome, titlebar, toolbar, centerscreen, dialog=no, modal, resizable=yes", params).focus();
  // Update the tree
  var webID = webIdentity.getWebIdentity(url);
  var attribute = detection.getAttribute(url, name);
  if (attribute.name == 'App Code Name') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.appCodeName);
  } else
  if (attribute.name == 'App Name') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.appName);
  } else
  if (attribute.name == 'App Version') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.appVersion);
  } else
  if (attribute.name == 'Language') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.language);
  } else
  if (attribute.name == 'OS CPU') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.oscpu);
  } else
  if (attribute.name == 'Platform') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.platform);
  } else
  if (attribute.name == 'Product') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.product);
  } else
  if (attribute.name == 'User-Agent') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.useragent);
  } else
  if (attribute.name == 'Vendor') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.vendor);
  } else
  if (attribute.name == 'CPU Class') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.cpuClass);
  } else
  if (attribute.name == 'System Language') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.systemLanguage);
  } else
  if (attribute.name == 'User Language') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.navigator.userLanguage);
  } else
  if (attribute.name == 'Screen Height') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.screen.height);
  } else
  if (attribute.name == 'Screen Width') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.screen.width);
  } else
  if (attribute.name == 'Color Depth') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.screen.colorDepth);
  } else
  if (attribute.name == 'Available Height') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.screen.availHeight);
  } else
  if (attribute.name == 'Available Width') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.screen.availWidth);
  } else
  if (attribute.name == 'Pixel Depth') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.screen.pixelDepth);
  } else
  if (attribute.name == 'Timezone') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webID.fingerprint.date.timezoneOffset);
  }
  if (attribute.action == 'spoof') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[2].setAttribute('src', 'chrome://fingerprintprivacy/skin/spoof.png');
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[2].setAttribute('label', ' Spoof');
  } else 
  if (attribute.action == 'block') {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[2].setAttribute('src', 'chrome://fingerprintprivacy/skin/block.png');
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[2].setAttribute('label', ' Block');
  } else {
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[2].setAttribute('src', 'chrome://fingerprintprivacy/skin/allow.png');
    tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[2].setAttribute('label', ' Allow');
  }
}

function deleteWebIdentityAttribute() {
  // Get the tree
  var tree = document.getElementById("webIdentitiesTree");
  // Get the selected index
  var currentIndex = tree.currentIndex;
  var cellText = tree.view.getCellText(currentIndex, tree.columns.getColumnAt(0));
  // Delete the selected web identity
  if (cellText.indexOf('.') != -1) {
    detection.deleteDetection(cellText);
    webIdentity.deleteWebIdentity(cellText);
  // Delete the selected attribute
  } else {
    var url = tree.view.getCellText(tree.view.getParentIndex(currentIndex), tree.columns.getColumnAt(0));
    detection.deleteAttribute(url, cellText);
  }
  // Update the tree
  tree.view.getItemAtIndex(currentIndex).parentNode.removeChild(tree.view.getItemAtIndex(currentIndex));
  // Update the number of web identities
  nrOfWebIdentities--;
  document.getElementById("number-of-web-identities").innerHTML = "Number of web identities: "+nrOfWebIdentities;
  if (preferences.getBoolPref('debuggingmode')) {
    document.getElementById("number-of-web-identities").innerHTML += "<span style='color:gray'>/"+webIdentity.getWebIdentities().length+"</span>";
  }
}

function regenerateWebIdentityAttribute() {
  // Get the tree
  var tree = document.getElementById("webIdentitiesTree");
  // Get the selected index
  var currentIndex = tree.currentIndex;
  var cellText = tree.view.getCellText(currentIndex, tree.columns.getColumnAt(0));
  // Regenerate the selected web identity
  if (cellText.indexOf('.') != -1) {
    var generatedFingerprint = randomFingerprintGenerator.generateAndCheckUniqueness(webIdentity.getWebIdentities());
    webIdentity.getWebIdentity(cellText).fingerprint = generatedFingerprint.fingerprint;
    webIdentity.getWebIdentity(cellText).profile = generatedFingerprint.profile;
    webIdentity.getWebIdentity(cellText).hash = generatedFingerprint.hash;
    webIdentity.getWebIdentity(cellText).usage = generatedFingerprint.usage;
    var attributes = tree.view.getItemAtIndex(currentIndex).getElementsByTagName("treeitem");
    for (var i = 0; i < attributes.length; i++) {
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'App Code Name') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.appCodeName);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'App Name') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.appName);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'App Version') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.appVersion);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Language') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.language);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'OS CPU') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.oscpu);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Platform') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.platform);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Product') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.product);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'User-Agent') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.useragent);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Vendor') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.vendor);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'CPU Class') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.cpuClass);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'System Language') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.systemLanguage);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'User Language') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.navigator.userLanguage);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Screen Height') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.screen.height);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Screen Width') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.screen.width);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Color Depth') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.screen.colorDepth);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Available Height') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.screen.availHeight);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Available Width') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.screen.availWidth);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Pixel Depth') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.screen.pixelDepth);
      } else
      if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Timezone') {
        attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(cellText).fingerprint.date.timezoneOffset);
      }
    }
  // Regenerate the selected attribute and update the tree accordingly
  } else {
    try {
      var domain = tree.view.getCellText(tree.view.getParentIndex(currentIndex), tree.columns.getColumnAt(0));
      if (cellText == 'App Code Name') {
        webIdentity.getWebIdentity(domain).fingerprint.navigator.appCodeName = randomFingerprintGenerator.generateAppCodeName(webIdentity.getWebIdentity(domain).profile);
        tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.appCodeName);
      } else
      if (cellText == 'App Name') {
        webIdentity.getWebIdentity(domain).fingerprint.navigator.appName = randomFingerprintGenerator.generateAppName(webIdentity.getWebIdentity(domain).profile);
        tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.appName);
      } else
      if (cellText == 'User-Agent' || cellText == 'App Version' || cellText == 'OS CPU' || cellText == 'Platform' || cellText == 'CPU Class') {
        var randomUserAgentAndNavigatiorObject = randomFingerprintGenerator.generateUserAgentAndNavigatorObject(webIdentity.getWebIdentity(domain).profile);
        webIdentity.getWebIdentity(domain).fingerprint.useragent = randomUserAgentAndNavigatiorObject.useragent;
        webIdentity.getWebIdentity(domain).fingerprint.navigator = randomUserAgentAndNavigatiorObject.navigatorObject;
        var attributes = tree.view.getItemAtIndex(currentIndex).parentNode.getElementsByTagName("treeitem");
        for (var i = 0; i < attributes.length; i++) {
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'User-Agent') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.useragent);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'App Version') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.appVersion);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'OS CPU') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.oscpu);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Platform') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.platform);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'CPU Class') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.cpuClass);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Language') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.language);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'System Language') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.systemLanguage);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'User Language') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.userLanguage);
          }
        }
      } else
      if (cellText == 'Language') {
        webIdentity.getWebIdentity(domain).fingerprint.navigator.language = randomFingerprintGenerator.generateLanguage(webIdentity.getWebIdentity(domain).profile);
        tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.language);
      } else
      if (cellText == 'System Language') {
        webIdentity.getWebIdentity(domain).fingerprint.navigator.systemLanguage = randomFingerprintGenerator.generateLanguage(webIdentity.getWebIdentity(domain).profile);
        tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.systemLanguage);
      } else
      if (cellText == 'User Language') {
        webIdentity.getWebIdentity(domain).fingerprint.navigator.userLanguage = randomFingerprintGenerator.generateLanguage(webIdentity.getWebIdentity(domain).profile);
        tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.userLanguage);
      } else
      if (cellText == 'Product') {
        webIdentity.getWebIdentity(domain).fingerprint.navigator.product = randomFingerprintGenerator.generateProduct(webIdentity.getWebIdentity(domain).profile);
        tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.product);
      } else
      if (cellText == 'Vendor') {
        webIdentity.getWebIdentity(domain).fingerprint.navigator.vendor = randomFingerprintGenerator.generateVendor(webIdentity.getWebIdentity(domain).profile);
        tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.navigator.vendor);
      } else
      if (cellText == 'Screen Height' || cellText == 'Screen Width' || cellText == 'Available Height' || cellText == 'Available Width') {
        var randomScreenObject = randomFingerprintGenerator.generateScreenObject(webIdentity.getWebIdentity(domain).profile);
        webIdentity.getWebIdentity(domain).fingerprint.screen.height = randomScreenObject.height;
        webIdentity.getWebIdentity(domain).fingerprint.screen.width = randomScreenObject.width;
        webIdentity.getWebIdentity(domain).fingerprint.screen.availHeight = randomScreenObject.availHeight;
        webIdentity.getWebIdentity(domain).fingerprint.screen.availWidth = randomScreenObject.availWidth;
        var attributes = tree.view.getItemAtIndex(currentIndex).parentNode.getElementsByTagName("treeitem");
        for (var i = 0; i < attributes.length; i++) {
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Screen Height') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.screen.height);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Screen Width') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.screen.width);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Available Height') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.screen.availHeight);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Available Width') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.screen.availWidth);
          }
        }
      } else
      if (cellText == 'Color Depth' || cellText == 'Pixel Depth') {
        var randomScreenObject = randomFingerprintGenerator.generateScreenObject(webIdentity.getWebIdentity(domain).profile);
        webIdentity.getWebIdentity(domain).fingerprint.screen.colorDepth = randomScreenObject.colorDepth;
        webIdentity.getWebIdentity(domain).fingerprint.screen.pixelDepth = randomScreenObject.pixelDepth;
        var attributes = tree.view.getItemAtIndex(currentIndex).parentNode.getElementsByTagName("treeitem");
        for (var i = 0; i < attributes.length; i++) {
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Color Depth') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.screen.colorDepth);
          } else
          if (attributes[i].firstChild.childNodes[0].getAttribute('label') == 'Pixel Depth') {
            attributes[i].firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.screen.pixelDepth);
          }
        }
      } else
      if (cellText == 'Timezone') {
        webIdentity.getWebIdentity(domain).fingerprint.date = randomFingerprintGenerator.generateTimezone(webIdentity.getWebIdentity(domain).profile);
        tree.view.getItemAtIndex(currentIndex).firstChild.childNodes[1].setAttribute('label', webIdentity.getWebIdentity(domain).fingerprint.date.timezoneOffset);
      }
      webIdentity.getWebIdentity(domain).hash = randomFingerprintGenerator.generateHash(webIdentity.getWebIdentity(domain).fingerprint);
    } catch(e) {
      alert(e);
    }
  }
}
