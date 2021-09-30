# Target dir for make install
PREFIX ?= /usr/local

# Dependency versions
DOCDASH_VERSION = 1.2.0
DUKTAPE_VERSION = 2.6.0

# Shorthand variables
CC = gcc
CP = cp -a --no-preserve=ownership 
JOSHPEC = src/joshpec/joshpec
JSDOC = .docdash/node_modules/.bin/jsdoc

# Main artifacts
DOCS = build/jsdoc
JOSHI = build/joshi/joshi
JOSHI_DBUS = build/joshi/joshi_dbus.so
JOSHI_TUI = build/joshi/joshi_tui.so

# Dependency artifacts
DUKTAPE_HEADERS = \
	src/duktape/duktape.h \
	src/duktape/duk_config.h
JOSHI_HEADERS = \
	$(DUKTAPE_HEADERS) \
	src/joshi/joshi.h \
	src/joshi/joshi_core.h
JOSHI_OBJECTS = \
	build/joshi/duktape.o \
	build/joshi/joshi.o \
	build/joshi/joshi_core.o 
JOSHI_DBUS_OBJECTS = \
	build/joshi/joshi_dbus.o
JOSHI_TUI_OBJECTS = \
	build/joshi/joshi_tui.o


#
# External targets
#
compile: $(JOSHI) $(JOSHI_DBUS) $(JOSHI_TUI)

format: 
	npx prettier --write 'specs/**/*.js' 'src/**/*.js' 'tests/**/*.js' 'examples/**/*.js'

lint:
	npx prettier --check 'specs/**/*.js' 'src/**/*.js' 'tests/**/*.js' 'examples/**/*.js'

test: 
	JOSHI_LIB_DIR="$(realpath src/library)" $(JOSHI) ./tests/index.js

docs: $(DOCS)

ci: clean lint compile test

clean: 
	@rm -rf build

install: 
	mkdir -p "$(PREFIX)/bin"
	$(CP) $(JOSHI) "$(PREFIX)/bin"

	mkdir -p "$(PREFIX)/include/joshi"
	$(CP) src/duktape/duktape.h "$(PREFIX)/include/joshi"
	$(CP) src/duktape/duk_config.h "$(PREFIX)/include/joshi"
	$(CP) src/joshi/joshi.h "$(PREFIX)/include/joshi"

	mkdir -p "$(PREFIX)/lib/joshi"
	$(CP) -R src/library/* "$(PREFIX)/lib/joshi"
	$(CP) $(JOSHI_DBUS) "$(PREFIX)/lib/joshi"
	$(CP) $(JOSHI_TUI) "$(PREFIX)/lib/joshi"

	mkdir -p "$(PREFIX)/lib/joshpec"
	$(CP) -R src/joshpec/* "$(PREFIX)/lib/joshpec"

	mkdir -p "$(PREFIX)/share/doc/joshi"
	$(CP) -R $(DOCS)/* "$(PREFIX)/share/doc/joshi"

uninstall:
	rm "$(PREFIX)/bin/joshi"
	rm -rf "$(PREFIX)/include/joshi"
	rm -rf "$(PREFIX)/lib/joshi"
	rm -rf "$(PREFIX)/lib/joshpec"
	rm -rf "$(PREFIX)/share/doc/joshi"

release:
	./scripts/release


#
# Internal targets
#
$(JOSHI): $(JOSHI_OBJECTS)
	mkdir -p build/joshi
	gcc $(JOSHI_OBJECTS) -lcrypt -ldl -lm -o $@ -Wl,--export-dynamic

$(JOSHI_DBUS): $(JOSHI_DBUS_OBJECTS)
	mkdir -p build/joshi
	gcc $(JOSHI_DBUS_OBJECTS) -ldbus-1 -o $@ -shared

$(JOSHI_TUI): $(JOSHI_TUI_OBJECTS)
	mkdir -p build/joshi
	gcc $(JOSHI_TUI_OBJECTS) -lcurses -o $@ -shared

$(DOCS): .docdash
	@rm -rf $(DOCS)
	$(JSDOC) -c jsdoc.json


#
# Dependencies
#
build/joshi/duktape.o: $(DUKTAPE_HEADERS)
build/joshi/joshi.o: $(JOSHI_HEADERS)
build/joshi/joshi_core.o: $(JOSHI_HEADERS)
build/joshi/joshi_dbus.o: $(JOSHI_HEADERS)
build/joshi/joshi_tui.o: $(JOSHI_HEADERS)


#
# Build rules
#
build/joshi/duktape.o: src/duktape/duktape.c
	@mkdir -p build/joshi
	$(CC) -o $@ -I src/duktape -c src/duktape/duktape.c

build/joshi/%.o: src/joshi/%.c
	@mkdir -p build/joshi
	$(CC) -o $@ -I /usr/include/dbus-1.0 -I /usr/lib/dbus-1.0/include/ -I src/joshi -I src/duktape -c $< -fPIC


#
# Spec stuff
#
fix-spec:
	git checkout src/joshi/joshi_core.c
	git checkout src/joshi/joshi_dbus.c
	git checkout src/joshi/joshi_tui.c

spec: 
	JOSHI_LIB_DIR="$(realpath src/library)" $(JOSHPEC) ./specs/core
	JOSHI_LIB_DIR="$(realpath src/library)" $(JOSHPEC) ./specs/dbus
	JOSHI_LIB_DIR="$(realpath src/library)" $(JOSHPEC) ./specs/tui


#
# Duktape stuff
#
duktape: .duktape

.duktape:
	@mkdir -p .duktape
	curl https://duktape.org/duktape-$(DUKTAPE_VERSION).tar.xz -o .duktape/duktape.tar.xz
	cd .duktape && xz --keep -d -v duktape.tar.xz 
	cd .duktape && tar xf duktape.tar
	python2 .duktape/duktape-$(DUKTAPE_VERSION)/tools/configure.py --output-directory src/duktape


#
# Docdash stuff
#
docdash: .docdash

.docdash:
	@mkdir -p .docdash
	curl https://codeload.github.com/clenemt/docdash/tar.gz/$(DOCDASH_VERSION) -o .docdash/docdash.tar.gz
	cd .docdash && tar xvf docdash.tar.gz
	mv .docdash/docdash-$(DOCDASH_VERSION)/* .docdash
	rm -rf .docdash/docdash-$(DOCDASH_VERSION)
	cd .docdash && npm install
	cd .docdash && npm install jsdoc
