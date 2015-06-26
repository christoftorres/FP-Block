/****************************************************************/
/* -- Fingerprint Privacy --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 03.02.2015                                             */
/****************************************************************/

Components.utils.import("resource://modules/webIdentity.jsm");

// Called once when the dialog displays
function onLoad() {
  // If the window has any parameters then...
  if (window.arguments != null) {
    // Get the web identity based on the domain parameter of the window 
    var webID = webIdentity.getWebIdentity(window.arguments[0].domain);
    // Set the domain name
    document.getElementById('domain-name').value = webID.domain;
    // Set the number of third-parties
    document.getElementById('thirdparties-number').value = webID.thirdparties.length;
    // Get the richlistbox
    var richlistbox = document.getElementById('richlistbox-third-parties');
    // Add all third-parties to the richlistbox
    var thirdparties = webID.thirdparties;
    for (var index in thirdparties) {
      // Create a new richlistitem
      var richlistitem = document.createElement('richlistitem');
      // Create a new checkbox
      var checkbox = document.createElement('checkbox');
      // Add the label of the current third-party to the checkbox  
      checkbox.setAttribute('label', thirdparties[index].name); 
      // Set the checkbox as checked if the current third-party is enabled
      checkbox.setAttribute('checked', thirdparties[index].enabled);
      // Append the checkbox to the richlistitem
      richlistitem.appendChild(checkbox);
      // Append the richlistitem to the richlistbox
      richlistbox.appendChild(richlistitem);
    }
  }
}

// Called when the user clicks on the 'OK' button
function accept() {
  // Get the domain name
  var domain = document.getElementById('domain-name').value;
  // Get all the checkboxes
  var checkboxes = document.getElementsByTagName('checkbox');
  // Get all third-parties
  var thirdparties = webIdentity.getWebIdentity(domain).thirdparties;
  // For each third-party...
  for (var index in thirdparties) {
    // ...set the third-party as enabled/disabled if the coresponding checkbox was checked/unchecked
    thirdparties[index].enabled = checkboxes[index].getAttribute('checked');
  }
}
