# FP-Block

Copyright (C) 2015 - Christof Torres

License/usage:

This program is released under the terms of the GPL v3 license, a copy of which should be included with this distribution.
This program is provided "AS IS", without any warranties of any kind, either expressed or implied.

Installation instructions
=========================

1. Compile the source
2. Install the plugin

Compile the source
------------------

Windows:

Select the "Plugin" folder, do a right-click and choose: Send To -> Compressed (Zipped) Folder. Afterwards you simply rename the resulting ZIP file to .xpi instead of .zip. Done!

Mac & Linux:

In order to "compile" the source code to a Firefox extension, you only need to
run the file "Makefile" or manually run the following command inside the console:

Mac

	zip -r ../fingerprintprivacy.xpi * -x *.DS Store*
	
Linux

	zip -r ../fingerprintprivacy.xpi *

Install the plugin
------------------

To install the plugin, just drag and drop the FP-Block.xpi
file onto Firefox. A popup window will appear asking to install. Click
"Install" and restart Firefox. Enjoy!
