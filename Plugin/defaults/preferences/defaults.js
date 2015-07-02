/****************************************************************/
/* -- FP-Block --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 13.02.2015                                             */
/****************************************************************/

// First run
pref("extensions.fpblock.firstrun", true);
// Genreal preferences
pref("extensions.fpblock.notifydetections", true);
// HTTP preferences
pref("extensions.fpblock.blockthirdparties", true);
//pref("extensions.fpblock.deletereferer", true);
pref("extensions.fpblock.dntheader", true);
pref("extensions.fpblock.deleteetags", true);
// JavaScript preferences
pref("extensions.fpblock.autoblocksocial", false);
pref("extensions.fpblock.autoblockplugins", true);
// Data storage
pref("extensions.fpblock.webidentities", "[]");
pref("extensions.fpblock.detections", "[]");
// Limit of generated unique web identities
pref("extensions.fpblock.webidentitieslimit", 1024);
// Date of last time that profiles were fetched
pref("extensions.fpblock.latestfetch", "");
// Debugging mode
pref("extensions.fpblock.debuggingmode", false);