# TODO: migrate my-sway
# TODO: etc directory holding links to joshi lib dirs
# TODO: investigate curses
# TODO: interactive shell
# TODO: ES6 on the fly compilation and bytecode cache directory
# TODO: modify spec to make it more robust and extensible (generate push and pop functions)
# TODO: add require_type() calls to spec stubs to avoid core dumps
# TODO: dynamic library integration (for extension) (dlopen,sym,close functions to load symbol tables)
# TODO: after dynamic library integration: dbus integration
# TODO: after dynamic library integration: gtk integration
# TODO: after dynamic library integration: optimize my-sway

CC = gcc
DUKTAPE_VERSION = 2.6.0
LIBS = -lm

OBJECTS = \
	build/joshi.o \
	build/duktape.o \
	build/joshi_core.o \
	build/joshi_spec.o

all: joshi

joshi: $(OBJECTS)
	gcc build/*.o -o joshi $(LIBS)


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
