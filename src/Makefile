# TODO: migrate my-sway
# TODO: make atexit not to be inherited by forked processes
# TODO: investigate ncurses + panel
# TODO: interactive shell (nnn + right panel shell)
# TODO: ES6 on the fly compilation and bytecode cache directory
# TODO: dynamic library integration (for extension) (dlopen,sym,close functions to load symbol tables)
# TODO: after dynamic library integration: dbus integration
# TODO: after dynamic library integration: gtk integration
# TODO: after dynamic library integration: optimize my-sway

CC = gcc
DOCDASH_VERSION = 1.2.0
DUKTAPE_VERSION = 2.6.0
LIBS = -lm

OBJECTS = \
	build/joshi.o \
	build/duktape.o \
	build/joshi_core.o \
	build/joshi_spec.o

all: joshi docs test

docs: docdash-template
	@rm -rf ./jsdoc
	jsdoc -c jsdoc.json

joshi: $(OBJECTS)
	gcc build/*.o -o joshi $(LIBS)

test: 
	./joshi ./tests/index.js


#
# Dependencies
#
build/duktape.o: src/duktape/duktape.h src/duktape/duk_config.h
build/joshi.o: src/joshi_core.h src/duktape/duktape.h src/duktape/duk_config.h
build/joshi_core.o: src/joshi_core.h src/duktape/duktape.h src/duktape/duk_config.h
build/joshi_spec.o: src/joshi_spec.h src/duktape/duktape.h src/duktape/duk_config.h


#
# Spec stuff
#
fix-spec:
	git checkout src/joshi_spec.c

spec: 
	-rm src/joshi_spec.c >/dev/null 2>&1
	./joshi ./tools/spec.js ./src


#
# Duktape stuff
#
build/duktape.o: src/duktape/duktape.c
	@mkdir -p build 
	$(CC) -o $@ -I src/duktape -c src/duktape/duktape.c

src/duktape/duktape.c: duktape/duktape-$(DUKTAPE_VERSION)/tools/configure.py
	python2 duktape/duktape-$(DUKTAPE_VERSION)/tools/configure.py --output-directory src/duktape

duktape/duktape-$(DUKTAPE_VERSION)/tools/configure.py: duktape/duktape.tar 
	cd duktape && tar xf duktape.tar
	touch $@

duktape/duktape.tar: duktape/duktape.tar.xz
	cd duktape && xz --keep -d -v duktape.tar.xz 

duktape/duktape.tar.xz:
	@mkdir -p duktape
	curl https://duktape.org/duktape-$(DUKTAPE_VERSION).tar.xz -o duktape/duktape.tar.xz


#
# Docdash stuff
#
docdash-template: docdash/package-lock.json

docdash/package-lock.json: docdash/package.json
	cd docdash && npm install
	touch docdash/package-lock.json

docdash/package.json: docdash/docdash.tar.gz
	cd docdash && tar xvf docdash.tar.gz
	mv docdash/docdash-$(DOCDASH_VERSION)/* docdash
	rm -rf docdash/docdash-$(DOCDASH_VERSION)
	touch docdash/package.json

docdash/docdash.tar.gz:
	@mkdir -p docdash
	curl https://codeload.github.com/clenemt/docdash/tar.gz/$(DOCDASH_VERSION) -o docdash/docdash.tar.gz


#
# Clean target
#
clean: 
	@rm -rf build
	@rm joshi


#
# Implicit rules
#
build/%.o: src/%.c
	@mkdir -p build
	$(CC) -o $@ -Isrc -Isrc/duktape -c $<
