#include <locale.h>
#include <ncurses.h>
#include <errno.h>

#include "joshi.h"

#define duk_get_attr_t(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_attr_t(ctx,value) duk_push_int((ctx),(value))
static char* duk_get_char_pt(duk_context* ctx, duk_idx_t idx);
#define duk_push_char_pt(ctx,value) duk_push_string((ctx),(value))
#define duk_get_int(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_int(ctx,value) duk_push_int((ctx),(value))
#define duk_get_short(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_short(ctx,value) duk_push_int((ctx),(value))
static WINDOW* duk_get_WINDOW_pt(duk_context* ctx, duk_idx_t idx);
#define duk_push_WINDOW_pt(ctx,value) memcpy(duk_push_fixed_buffer(ctx,sizeof(WINDOW*)),&(value),sizeof(WINDOW*))

static char* duk_get_char_pt(duk_context* ctx, duk_idx_t idx) {
	if (duk_is_null(ctx, idx) || duk_is_undefined(ctx, idx)) {
		return NULL;
	}

	const char* cesu = duk_require_string(ctx, idx);
	JOSHI_MBLOCK* blk = joshi_mblock_alloc(ctx, cnv_cesu_to_utf_length(cesu) + 1);
	char* utf = (char*)blk->data;

	cnv_cesu_to_utf(cesu, utf);

	return utf;
}

static WINDOW* duk_get_WINDOW_pt(duk_context* ctx, duk_idx_t idx) {
	WINDOW* value;
	memcpy(&value, duk_require_buffer_data(ctx, idx, NULL), sizeof(WINDOW*));
	return value;
}

static duk_ret_t _js_curs_set(duk_context* ctx) {
	int visibility;

	visibility = duk_get_int(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	curs_set(visibility);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_delwin(duk_context* ctx) {
	WINDOW* win;

	win = duk_get_WINDOW_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	delwin(win);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_endwin(duk_context* ctx) {


	errno = 0;
	int ret_value;
	ret_value = 

	endwin();

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_getmaxyx(duk_context* ctx) {
	WINDOW* win;
	int y;
	int x;

	win = duk_get_WINDOW_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	getmaxyx(win,y,x);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_object(ctx);
	duk_push_int(ctx, y);
	duk_put_prop_string(ctx, -2, "y");
	duk_push_int(ctx, x);
	duk_put_prop_string(ctx, -2, "x");
	duk_push_int(ctx, ret_value);
	duk_put_prop_string(ctx, -2, "value");

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_getyx(duk_context* ctx) {
	WINDOW* win;
	int y;
	int x;

	win = duk_get_WINDOW_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	getyx(win,y,x);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_object(ctx);
	duk_push_int(ctx, y);
	duk_put_prop_string(ctx, -2, "y");
	duk_push_int(ctx, x);
	duk_put_prop_string(ctx, -2, "x");
	duk_push_int(ctx, ret_value);
	duk_put_prop_string(ctx, -2, "value");

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_init_color(duk_context* ctx) {
	int color;
	int r;
	int g;
	int b;

	color = duk_get_int(ctx, 0);
	r = duk_get_int(ctx, 1);
	g = duk_get_int(ctx, 2);
	b = duk_get_int(ctx, 3);

	errno = 0;
	int ret_value;
	ret_value = 

	init_color(color,r,g,b);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_init_pair(duk_context* ctx) {
	int pair;
	int fg;
	int bg;

	pair = duk_get_int(ctx, 0);
	fg = duk_get_int(ctx, 1);
	bg = duk_get_int(ctx, 2);

	errno = 0;
	int ret_value;
	ret_value = 

	init_pair(pair,fg,bg);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_mvwin(duk_context* ctx) {
	WINDOW* win;
	int y;
	int x;

	win = duk_get_WINDOW_pt(ctx, 0);
	y = duk_get_int(ctx, 1);
	x = duk_get_int(ctx, 2);

	errno = 0;
	int ret_value;
	ret_value = 

	mvwin(win,y,x);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_newwin(duk_context* ctx) {
	int nlines;
	int ncols;
	int y;
	int x;

	nlines = duk_get_int(ctx, 0);
	ncols = duk_get_int(ctx, 1);
	y = duk_get_int(ctx, 2);
	x = duk_get_int(ctx, 3);

	errno = 0;
	WINDOW* ret_value;
	ret_value = 

	newwin(nlines,ncols,y,x);

	if (ret_value == NULL) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_WINDOW_pt(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_waddstr(duk_context* ctx) {
	WINDOW* win;
	char* str;

	win = duk_get_WINDOW_pt(ctx, 0);
	str = duk_get_char_pt(ctx, 1);

	errno = 0;
	int ret_value;
	ret_value = 

	waddstr(win,str);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_wattr_get(duk_context* ctx) {
	WINDOW* win;
	attr_t attrs;
	short pair;

	win = duk_get_WINDOW_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	wattr_get(win,&(attrs),&(pair),NULL);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_object(ctx);
	duk_push_attr_t(ctx, attrs);
	duk_put_prop_string(ctx, -2, "attrs");
	duk_push_short(ctx, pair);
	duk_put_prop_string(ctx, -2, "pair");
	duk_push_int(ctx, ret_value);
	duk_put_prop_string(ctx, -2, "value");

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_wattr_set(duk_context* ctx) {
	WINDOW* win;
	attr_t attrs;
	short pair;

	win = duk_get_WINDOW_pt(ctx, 0);
	attrs = duk_get_attr_t(ctx, 1);
	pair = duk_get_short(ctx, 2);

	errno = 0;
	int ret_value;
	ret_value = 

	wattr_set(win,attrs,pair,NULL);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_wclear(duk_context* ctx) {
	WINDOW* win;

	win = duk_get_WINDOW_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	wclear(win);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_werase(duk_context* ctx) {
	WINDOW* win;

	win = duk_get_WINDOW_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	werase(win);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_winsstr(duk_context* ctx) {
	WINDOW* win;
	char* str;

	win = duk_get_WINDOW_pt(ctx, 0);
	str = duk_get_char_pt(ctx, 1);

	errno = 0;
	int ret_value;
	ret_value = 

	winsstr(win,str);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_wmove(duk_context* ctx) {
	WINDOW* win;
	int y;
	int x;

	win = duk_get_WINDOW_pt(ctx, 0);
	y = duk_get_int(ctx, 1);
	x = duk_get_int(ctx, 2);

	errno = 0;
	int ret_value;
	ret_value = 

	wmove(win,y,x);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

static duk_ret_t _js_wrefresh(duk_context* ctx) {
	WINDOW* win;

	win = duk_get_WINDOW_pt(ctx, 0);

	errno = 0;
	int ret_value;
	ret_value = 

	wrefresh(win);

	if (ret_value == ERR) {
		joshi_mblock_free_all(ctx);
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	duk_push_int(ctx, ret_value);

	joshi_mblock_free_all(ctx);
	return 1;
}

/* BEGIN CUSTOM USER CODE */
#define CHECK_RC(x) \
	if ((x) == ERR) { \
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed"); \
		duk_throw(ctx); \
	}

static duk_ret_t _js_initscr(duk_context* ctx) {
	setlocale(LC_CTYPE, "");

	WINDOW* win = initscr();
	if (!win) {
		duk_push_error_object(ctx, DUK_ERR_ERROR, "ncurses call failed");
		duk_throw(ctx);
	}

	CHECK_RC(raw());
	CHECK_RC(keypad(stdscr, TRUE));
	CHECK_RC(noecho());
	CHECK_RC(set_escdelay(125));

	if (has_colors()) {
		CHECK_RC(start_color());
	}

	duk_push_object(ctx);
	duk_push_WINDOW_pt(ctx, win);
	duk_put_prop_string(ctx, -2, "win");
	duk_push_boolean(ctx, has_colors());
	duk_put_prop_string(ctx, -2, "has_colors");
	duk_push_boolean(ctx, can_change_color());
	duk_put_prop_string(ctx, -2, "can_change_color");
	duk_push_int(ctx, COLORS);
	duk_put_prop_string(ctx, -2, "max_colors");
	duk_push_int(ctx, COLOR_PAIRS);
	duk_put_prop_string(ctx, -2, "max_color_pairs");

	return 1;
}

static duk_ret_t _js_wgetch(duk_context* ctx) {
	int ch;
	CHECK_RC(ch = wgetch(stdscr));
	duk_push_int(ctx, ch);
	return 1;
}
/* END CUSTOM USER CODE */

JOSHI_FN_DECL joshi_fn_decls[] = {
	{ name: "curs_set", func: _js_curs_set, argc: 1 },
	{ name: "delwin", func: _js_delwin, argc: 1 },
	{ name: "endwin", func: _js_endwin, argc: 0 },
	{ name: "getmaxyx", func: _js_getmaxyx, argc: 3 },
	{ name: "getyx", func: _js_getyx, argc: 3 },
	{ name: "init_color", func: _js_init_color, argc: 4 },
	{ name: "init_pair", func: _js_init_pair, argc: 3 },
	{ name: "initscr", func: _js_initscr, argc: 0 },
	{ name: "mvwin", func: _js_mvwin, argc: 3 },
	{ name: "newwin", func: _js_newwin, argc: 4 },
	{ name: "waddstr", func: _js_waddstr, argc: 2 },
	{ name: "wattr_get", func: _js_wattr_get, argc: 4 },
	{ name: "wattr_set", func: _js_wattr_set, argc: 4 },
	{ name: "wclear", func: _js_wclear, argc: 1 },
	{ name: "werase", func: _js_werase, argc: 1 },
	{ name: "wgetch", func: _js_wgetch, argc: 0 },
	{ name: "winsstr", func: _js_winsstr, argc: 2 },
	{ name: "wmove", func: _js_wmove, argc: 3 },
	{ name: "wrefresh", func: _js_wrefresh, argc: 1 },
};

size_t joshi_fn_decls_count = 19;