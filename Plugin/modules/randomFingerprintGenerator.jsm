/****************************************************************/
/* -- FP-Block --                                    */
/* Author: Christof Ferreira Torres                             */
/* Date: 11.02.2015                                             */
/****************************************************************/

var EXPORTED_SYMBOLS = ["randomFingerprintGenerator"]; 

Components.utils.import("resource://modules/profiles.jsm");

var Cc = Components.classes;
var Ci = Components.interfaces;

var preferences = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.fpblock.');

/* 
   This random fingerprint generator is based on Jeffrey Mealo random user-agent 
   generator version 0.0.6 which is under the MIT license.
   Author: Jeffrey Mealo 
   E-mail: jeffreymealo@gmail.com
   Web   : http://www.jeffreymealo.com 
   URL   : https://github.com/jmealo/random-ua.js.git
*/

/* 
   This generator was updated to generate random fingerprints based on a particular random profile.
   Author: Christof Ferreira Torres
   E-mail: christof.ferreira.001@student.uni.lu
*/

function random(a, b) {
    //calling random() with no arguments is identical to random(0, 100)
    a = a || 0;
    b = b || 100;

    if (typeof b === 'number' && typeof a === 'number') {
        //random(int min, int max) returns an integer between min, max
        return (function (min, max) {
            if (min > max) {
                throw new RangeError('expected min <= max; got min = ' + min + ', max = ' + max);
            }
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }(a, b));
    }

    if (Object.prototype.toString.call(a) === "[object Array]") {
        //returns a random element from array (a), even weighting
        return a[Math.floor(Math.random() * a.length)];
    }

    if (a && typeof a === 'object') {
        //returns a random key from the passed object; keys are weighted by the decimal probability in their value
        return (function (obj) {
            var rand = random(0, 100) / 100, min = 0, max = 0, key, return_val;

            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    max = obj[key] + min;
                    return_val = key;
                    if (rand >= min && rand <= max) {
                        break;
                    }
                    min = min + obj[key];
                }
            }

            return return_val;
        }(a));
    }

    throw new TypeError('Invalid arguments passed to random. (' + (b ? a + ', ' + b : a) + ')');
}

/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash
 */
function murmurhash3_32_gc(key, seed) {
    var remainder, bytes, h1, h1b, c1, c2, k1, i;
      
    remainder = key.length & 3; // key.length % 4
    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;
      
    while (i < bytes) {
        k1 = 
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;
        
        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

        h1 ^= k1;
            h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }
      
    k1 = 0;
      
    switch (remainder) {
        case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1: k1 ^= (key.charCodeAt(i) & 0xff);
        
        k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
        h1 ^= k1;
    }
      
    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}

var version_string = {
    nt: function (profile) {
        return random(profile.versions.nt.major.min, profile.versions.nt.major.max) + '.' + random(profile.versions.nt.minor.min, profile.versions.nt.minor.max);
    },
    osx: function (profile, delim) {
        return [10, random(profile.versions.osx.major.min, profile.versions.osx.major.max), random(profile.versions.osx.minor.min, profile.versions.osx.minor.max)].join(delim || '.');
    }
};

var useragent = {
    firefox: function firefox(profile, os, proc, language) {
        //https://developer.mozilla.org/en-US/docs/Gecko_user_agent_string_reference
        var firefox_ver = random(profile.versions.major.min, profile.versions.major.max) + getRandomRevision(2, profile.versions.revision),
            gecko_ver = profile.versions.gecko + firefox_ver,
            os_ver = (os === 'win') ? '(Windows NT ' + version_string.nt(profile) + ((proc) ? '; ' + proc : '')
            : (os === 'mac') ? '(Macintosh; ' + proc + ' Mac OS X ' + version_string.osx(profile)
            : '(X11; Linux ' + proc;
        
        return 'Mozilla/5.0 ' + os_ver + '; rv:' + firefox_ver.slice(0, -2) + ') ' + gecko_ver;
    },

    opera: function opera(profile, os, proc, language) {
        //http://www.opera.com/docs/history/
        var presto = profile.versions.presto.major + random(profile.versions.presto.minor.min, profile.versions.presto.minor.max),
            presto2 = random(profile.versions.presto2.major.min, profile.versions.presto2.major.max) + profile.versions.presto2.minor,
            presto_ver = ' Presto/' + presto + ' Version/' + presto2 + ')',
            os_ver = (os === 'win') ? '(Windows NT ' + version_string.nt(profile) + '; U; ' + language + presto_ver
            : (os === 'lin') ? '(X11; Linux ' + proc + '; U; ' + language + presto_ver
            : '(Macintosh; Intel Mac OS X ' + version_string.osx(profile, '_') + ' U; ' + language + ' Presto/' + presto + ' Version/' + presto2 + ')';
        
        return 'Opera/' + random(profile.versions.major.min, profile.versions.major.max) + '.' + random(profile.versions.minor.min, profile.versions.minor.max) + ' ' + os_ver;
    },

    safari: function safari(profile, os, proc, language) {
        var safari = random(profile.versions.applewebkit.major.min, profile.versions.applewebkit.major.max) + '.' + random(profile.versions.applewebkit.minor.min, profile.versions.applewebkit.minor.max) + '.' + random(profile.versions.applewebkit.build.min, profile.versions.applewebkit.build.max),
            ver = (random(0, 1) === 0) ? '0.' + random(profile.versions.build.min, profile.versions.build.max) : random(profile.versions.minor.min, profile.versions.minor.max),
            os_ver = (os === 'mac') ? '(Macintosh; ' + proc + ' Mac OS X '+ version_string.osx(profile, '_') + ' rv:' + random(2, 6) + '.0; '+ language + ') '
            : '(Windows; U; Windows NT ' + version_string.nt(profile) + ')';
        
        return 'Mozilla/5.0 ' + os_ver + ' AppleWebKit/' + safari + ' (KHTML, like Gecko) Version/' + random(profile.versions.major.min, profile.versions.major.max) + '.' + ver + ' Safari/' + safari;
    },

    chrome: function chrome(profile, os, proc, language) {
        var safari = random(profile.versions.applewebkit.major.min, profile.versions.applewebkit.major.max) + '.' + random(profile.versions.applewebkit.minor.min, profile.versions.applewebkit.minor.max) + '.' + random(profile.versions.applewebkit.build.min, profile.versions.applewebkit.build.max),
            os_ver = (os === 'mac') ? '(Macintosh; ' + proc + ' Mac OS X ' + version_string.osx(profile, '_') + ') '
            : (os === 'win') ? '(Windows; U; Windows NT ' + version_string.nt(profile) + ')'
            : '(X11; Linux ' + proc;
        
        return 'Mozilla/5.0 ' + os_ver + ' AppleWebKit/' + safari + ' (KHTML, like Gecko) Chrome/' + [random(profile.versions.major.min, profile.versions.major.max), 0, random(profile.versions.build.min, profile.versions.build.max), 0].join('.') + ' Safari/' + safari;
    }
};

function getRandomProfile() {
    return random(profiles);
}

function getRandomOS(profile) {
    return random(profile.os);
}

function getRandomProcessor(profile, os) {
    return random(profile.procs[os]);
}

function getRandomRevision(dots, revision) {
    var return_val = '';
    for (var x = 0; x < dots; x++) {
        return_val += '.' + random(0, revision);
    }
    return return_val;
}

function getRandomUserAgent(profile, os, proc, language) {
    return useragent[profile.browser](profile, os, proc, language);
}

function getRandomLanguage(profile) {
    return random(profile.languages);
}

function getRandomNavigatorObject(profile, os, proc, language, useragent) {
    var platform = (os === 'win') ? 'Win32' : (os === 'mac') ? 'MacIntel' : 'Linux ' + proc;
    var cpuClass = (proc.contains('Intel')) ? 'x86' : (proc.contains('86')) ? 'x86' : (proc.contains('PPC')) ? 'PPC' : 'Other';
    var appVersion = (profile.browser === 'opera') ? useragent : useragent.substring(8, useragent.length); 
    return {
        appCodeName : profile.appCodeName,
        appName : profile.appName,
        language : language,
        appVersion : appVersion,
        platform : platform,
        oscpu : platform,
        product : profile.product,
        vendor : profile.vendor,
        cpuClass : cpuClass,
        systemLanguage : language,
        userLanguage : language
    };   
}

function getRandomScreenObject(profile) {
    var screenresolution = random(profile.screen.resolutions);
    var colordepth = random(profile.screen.colordepth);
    return {
        width : parseInt(screenresolution.split('x')[0]), 
        height : parseInt(screenresolution.split('x')[1]), 
        colorDepth : parseInt(colordepth),
        availWidth : parseInt(screenresolution.split('x')[0]), 
        availHeight : parseInt(screenresolution.split('x')[1])-profile.screen.toolbar, 
        pixelDepth : parseInt(colordepth)
    };
}

function getRandomDateObject(profile) {
    return {
        timezoneOffset : random(profile.timezones)
    };
}

function getAcceptObject(profile) {
    return {
        acceptEncoding : profile.http.encoding
    };    
}

function checkUniqueness(generatedFingerprint, webIdentities) {
    if (webIdentities.length > 0) {
        var i = 0;
        var unique = true;
        while (unique && i < webIdentities.length) {
            if (generatedFingerprint.hash == webIdentities[i].hash) {
                unique = false;
            } 
            i++;
        }
        return unique;
    } else {
        return true;
    }
}

var randomFingerprintGenerator = {
    generate : function() {
        var profile = getRandomProfile();
        var os = getRandomOS(profile);
        var proc = getRandomProcessor(profile, os);
        var language = getRandomLanguage(profile);
        var useragent = getRandomUserAgent(profile, os, proc, language);
        var navigatorObject = getRandomNavigatorObject(profile, os, proc, language, useragent);
        var screenObject = getRandomScreenObject(profile);
        var dateObject = getRandomDateObject(profile);
        var acceptObject = getAcceptObject(profile);
        var fingerprint = {useragent : useragent, navigator : navigatorObject, screen : screenObject, date : dateObject, accept : acceptObject};
        var hash = this.generateHash(fingerprint);
        var currentTime = new Date().getTime();
        return {profile : profile, fingerprint : fingerprint, hash : hash, usage : {amount : 1, date : currentTime}};
    },

    generateAndCheckUniqueness : function(webIdentities) {
        // As long as we didn't reach the limit of unique web identities...
        if (webIdentities.length < preferences.getIntPref('webidentitieslimit')) {
            // ...and as long as the fingerprint is not unique, generate a new fingerprint
            // and check its uniqueness among the existing web identities
            var generatedFingerprint;
            do {
                generatedFingerprint = this.generate();    
            } while (!checkUniqueness(generatedFingerprint, webIdentities));
            // Return the unique generated fingerprint
            return generatedFingerprint;
        } else {
            // Ok we reached the limit! Now we have to pick the least-used web identity and reuse it
            var leastused = webIdentities[0];
            for (var i = 1; i < webIdentities.length; i++) {
                if (webIdentities[i].usage.amount < leastused.usage.amount) {
                    leastused = webIdentities[i];
                } else 
                if (webIdentities[i].usage.amount = leastused.usage.amount) {
                    if (webIdentities[i].usage.date < leastused.usage.date) {
                        leastused = webIdentities[i];
                    }
                }
            }
            leastused.usage.amount++;
            // Return the least-used profile, fingerprint, hash, usage and domain
            var currentTime = new Date().getTime();
            return {profile : leastused.profile, fingerprint : leastused.fingerprint, hash : leastused.hash, usage : {amount : leastused.usage.amount, date : currentTime}};
        }
    },

    generateHash : function(fingerprint) {
        // Group 0 - Browser
        /*var group0 =    fingerprint.useragent + '###' + 
                        fingerprint.navigator.appCodeName + '###' + 
                        fingerprint.navigator.appName + '###' + 
                        fingerprint.navigator.appVersion  + '###' + 
                        fingerprint.navigator.product  + '###' + 
                        fingerprint.navigator.vendor  + '###' + 
                        fingerprint.accept.acceptEncoding;*/
        // Group 1 - OS & CPU
        var group1 =    fingerprint.navigator.platform + '###' +
                        fingerprint.navigator.oscpu  + '###' + 
                        fingerprint.navigator.cpuClass;
        // Group 2 - Screen Resolution
        var group2 =    fingerprint.screen.width + '###' + 
                        fingerprint.screen.height + '###' + 
                        fingerprint.screen.colorDepth + '###' + 
                        fingerprint.screen.availWidth  + '###' + 
                        fingerprint.screen.availHeight + '###' + 
                        fingerprint.screen.pixelDepth;
        // Group 3 - Timezone
        var group3 =    fingerprint.date.timezoneOffset;
        // Group 4 - Language
        var group4 =    fingerprint.navigator.language + '###' + 
                        fingerprint.navigator.systemLanguage + '###' + 
                        fingerprint.navigator.userLanguage;
        // Return the two hashes for Group 0 and Group 1 until Group 4
        return murmurhash3_32_gc(group1 + '###' + group2 + '###' + group3 + '###' + group4, 31);
    },

    generateAppCodeName : function(profile) {
        return profile.appcodename;
    },

    generateAppName : function(profile) {
        return profile.appname;
    },

    generateUserAgentAndNavigatorObject : function(profile) {
        var os = getRandomOS(profile);
        var proc = getRandomProcessor(profile, os);
        var language = getRandomLanguage(profile);
        var useragent = getRandomUserAgent(profile, os, proc, language);
        var navigatorObject = getRandomNavigatorObject(profile, os, proc, language, useragent);
        return {useragent : useragent, navigatorObject : navigatorObject};
    },

    generateLanguage : function(profile) {
        return getRandomLanguage(profile);
    },

    generateProduct : function(profile) {
        return profile.product;
    },

    generateVendor : function(profile) {
        return profile.vendor;
    },

    generateScreenObject : function(profile) {
        return getRandomScreenObject(profile);
    },

    generateTimezone : function(profile) {
        return getRandomDateObject(profile);
    }
};
