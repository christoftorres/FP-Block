plugindir=Plugin

all: ${plugindir}/*
	$(MAKE) -C $(plugindir)
