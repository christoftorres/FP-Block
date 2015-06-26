/****************************************************************/
/* -- Fingerprint Privacy --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 13.02.2015                                             */
/****************************************************************/

// First run
pref("extensions.fingerprintprivacy.firstrun", true);
// Genreal preferences
pref("extensions.fingerprintprivacy.notifydetections", true);
// HTTP preferences
pref("extensions.fingerprintprivacy.blockthirdparties", true);
//pref("extensions.fingerprintprivacy.deletereferer", true);
pref("extensions.fingerprintprivacy.dntheader", true);
pref("extensions.fingerprintprivacy.deleteetags", true);
// JavaScript preferences
pref("extensions.fingerprintprivacy.autoblocksocial", false);
pref("extensions.fingerprintprivacy.autoblockplugins", true);
// Data storage
pref("extensions.fingerprintprivacy.webidentities", "[]");
pref("extensions.fingerprintprivacy.detections", "[]");
// Limit of generated unique web identities
pref("extensions.fingerprintprivacy.webidentitieslimit", 1024);
// Date of last time that profiles were fetched
pref("extensions.fingerprintprivacy.latestfetch", "");
// Debugging mode
pref("extensions.fingerprintprivacy.debuggingmode", false);