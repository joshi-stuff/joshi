# Target dir for make install
PREFIX ?= /usr

# Dependency versions
DOCDASH_VERSION = 1.2.0
DUKTAPE_VERSION = 2.6.0

# Shorthand variables
CC = gcc
JOSHPEC = src/joshpec/joshpec
JSDOC = .docdash/node_modules/.bin/jsdoc

# Main artifacts
DOCS = build/jsdoc
JOSHI = build/joshi/joshi
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
JOSHI_TUI_OBJECTS = \
	build/joshi/joshi_tui.o


#
# External targets
#
compile: $(JOSHI) $(JOSHI_TUI)

test: 
	JOSHI_LIB_DIR="$(realpath src/library)" $(JOSHI) ./tests/index.js

docs: $(DOCS)

ci: compile test

clean: 
	@rm -rf build

install: compile docs
	mkdir -p "$(PREFIX)/bin"
	cp -a $(JOSHI) "$(PREFIX)/bin"

	mkdir -p "$(PREFIX)/include/joshi"
	cp -a src/duktape/duktape.h "$(PREFIX)/include/joshi"
	cp -a src/duktape/duk_config.h "$(PREFIX)/include/joshi"
	cp -a src/joshi/joshi.h "$(PREFIX)/include/joshi"

	mkdir -p "$(PREFIX)/lib/joshi"
	cp -aR src/library/* "$(PREFIX)/lib/joshi"
	cp -a $(JOSHI_TUI) "$(PREFIX)/lib/joshi"

	mkdir -p "$(PREFIX)/lib/joshpec"
	cp -aR src/joshpec/* "$(PREFIX)/lib/joshpec"

	mkdir -p "$(PREFIX)/share/doc/joshi"
	cp -aR $(DOCS)/* "$(PREFIX)/share/doc/joshi"

release:
	./scripts/release


#
# Internal targets
#
$(JOSHI): $(JOSHI_OBJECTS)
	mkdir -p build/joshi
	gcc $(JOSHI_OBJECTS) -lcrypt -ldl -lm -o $@ -Wl,--export-dynamic

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
build/joshi/joshi_tui.o: $(JOSHI_HEADERS)


#
# Build rules
#
build/joshi/duktape.o: src/duktape/duktape.c
	@mkdir -p build/joshi
	$(CC) -o $@ -I src/duktape -c src/duktape/duktape.c

build/joshi/%.o: src/joshi/%.c
	@mkdir -p build/joshi
	$(CC) -o $@ -Isrc/joshi -Isrc/duktape -c $< -fPIC


#
# Spec stuff
#
fix-spec:
	git checkout src/joshi/joshi_core.c
	git checkout src/joshi/joshi_tui.c

spec: 
	$(JOSHPEC) ./specs/core
	$(JOSHPEC) ./specs/tui


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
