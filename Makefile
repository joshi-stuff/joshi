CC = gcc
DUKTAPE_VERSION = 2.6.0
LIBS = -lm

OBJECTS = \
	build/joshi.o \
	build/duk_console.o \
	build/duktape.o \
	build/joshi_core.o

all: joshi

joshi: $(OBJECTS)
	gcc build/*.o -o joshi $(LIBS)

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

clean: 
	@rm -rf build

build/%.o: src/%.c
	@mkdir -p build
	$(CC) -o $@ -Isrc -Isrc/duktape -c $<

