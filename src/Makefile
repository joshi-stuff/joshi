# TODO: dynamic library integration (for extension) (dlopen,sym,close functions to load symbol tables)
# TODO: investigate ncurses + panel
# TODO: interactive shell (nnn + right panel shell)
# TODO: ES6 on the fly compilation and bytecode cache directory
# TODO: after dynamic library integration: dbus integration
# TODO: after dynamic library integration: gtk integration
# TODO: after dynamic library integration: optimize my-sway

CC = gcc
DOCDASH_VERSION = 1.2.0
DUKTAPE_VERSION = 2.6.0

PREFIX = dist

BIN = $(PREFIX)/usr/bin
LIB = $(PREFIX)/usr/lib
SHARE = $(PREFIX)/usr/share

JOSHI = $(BIN)/joshi
JOSHI_TUI = $(LIB)/joshi/joshi_tui.so
JOSHPEC = $(LIB)/joshpec/joshpec
DOCS = $(SHARE)/doc/joshi

DUKTAPE_HEADERS = \
	src/duktape/duktape.h \
	src/duktape/duk_config.h
JOSHI_HEADERS = \
	$(DUKTAPE_HEADERS) \
	src/joshi.h
JOSHI_OBJECTS = \
	build/joshi.o \
	build/duktape.o \
	build/joshi_core.o 
JOSHI_TUI_OBJECTS = \
	build/joshi_tui.o


#
# External targets
#
all: $(JOSHI) $(JOSHI_TUI) $(DOCS)

ci: all test

clean: 
	@rm -rf build
	@rm -f $(JOSHI)
	@rm -f $(JOSHI_TUI)
	@rm -rf $(DOCS)

docs: $(DOCS)

test: 
	JOSHI_LIB_DIR="$(realpath $(LIB)/joshi)" $(JOSHI) ./tests/index.js


#
# Internal targets
#
$(JOSHI): $(JOSHI_OBJECTS)
	mkdir -p dist/usr/bin
	gcc $(JOSHI_OBJECTS) -lcrypt -ldl -lm -o $@ -Wl,--export-dynamic

$(JOSHI_TUI): $(JOSHI_TUI_OBJECTS)
	gcc $(JOSHI_TUI_OBJECTS) -lcurses -o $@ -shared

$(DOCS): docdash
	@rm -rf $(DOCS)
	./docdash/node_modules/.bin/jsdoc -c jsdoc.json


#
# Dependencies
#
build/duktape.o: $(DUKTAPE_HEADERS)
build/joshi.o: $(JOSHI_HEADERS) src/joshi_core.h
build/joshi_core.o: $(JOSHI_HEADERS) src/joshi_core.h
build/joshi_tui.o: $(JOSHI_HEADERS)


#
# Build rules
#
build/duktape.o: src/duktape/duktape.c
	@mkdir -p build 
	$(CC) -o $@ -I src/duktape -c src/duktape/duktape.c

build/%.o: src/%.c
	@mkdir -p build
	$(CC) -o $@ -Isrc -Isrc/duktape -c $< -fPIC


#
# Spec stuff
#
fix-spec:
	git checkout src/joshi_core.c
	git checkout src/joshi_tui.c

spec: 
	$(JOSHPEC) ./specs/core
	$(JOSHPEC) ./specs/tui


#
# Duktape stuff
#
duktape:
	@mkdir -p duktape
	curl https://duktape.org/duktape-$(DUKTAPE_VERSION).tar.xz -o duktape/duktape.tar.xz
	cd duktape && xz --keep -d -v duktape.tar.xz 
	cd duktape && tar xf duktape.tar
	python2 duktape/duktape-$(DUKTAPE_VERSION)/tools/configure.py --output-directory src/duktape


#
# Docdash stuff
#
docdash:
	@mkdir -p docdash
	curl https://codeload.github.com/clenemt/docdash/tar.gz/$(DOCDASH_VERSION) -o docdash/docdash.tar.gz
	cd docdash && tar xvf docdash.tar.gz
	mv docdash/docdash-$(DOCDASH_VERSION)/* docdash
	rm -rf docdash/docdash-$(DOCDASH_VERSION)
	cd docdash && npm install
	cd docdash && npm install jsdoc
