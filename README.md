# FP-Block
Copyright (C) 2015 - Christof Torres

License/usage:
=========================
This program is released under the terms of the GPL v3 license, a copy
of which should be included with this distribution.
This program is provided "AS IS", without any warranties of any kind,
either expressed or implied.



About
=========================
Online tracking is big business. Various companies are so widely used on
the Web, that many (if not most) pages a casual user visits will embed
their products. Examples include Facebook ('like' button), Youtube
(videos), but also less visible aspects such as JQuery (popular
Javascript library). Whenever a browser encounters such embedded
contents, the embedded contents can determine the browser's
"fingerprint" - a set of attribute values of the browser (resolution,
language, OS, browser version, etc). As such, they can track a browser
across each and every page where they are embedded.

The FP-Block Firefox plugin ensures that each visited website is
provided with a unique fingerprint. This ensures that all embedded
parties also see that unique fingerprint, and thus no longer can track
users across different websites.




Installation instructions
=========================

1. Compile the source
2. Install the plugin

Compile the source
------------------

**Windows:**

	Select the "Plugin" folder, do a right-click and choose:
		Send To -> Compressed (Zipped) Folder
	Afterwards you simply rename the resulting ZIP file to .xpi
	instead of .zip. Done!

**Mac & Linux:**

	In order to "compile" the source code to a Firefox extension,
	you only need to run the file "Makefile" or manually run the
	following command inside the console:

	Mac
		zip -r ../FP-Block.xpi * -x *.DS Store*
		
	Linux
		zip -r ../FP-Block.xpi *

Install the plugin
------------------
To install the plugin, just drag and drop the FP-Block.xpi
file onto Firefox. A popup window will appear asking to install. Click
"Install" and restart Firefox. Enjoy!
