#include <dbus/dbus.h>
#include <errno.h>

#include "joshi.h"

static char* duk_get_char_pt(duk_context* ctx, duk_idx_t idx);
#define duk_push_char_pt(ctx,value) duk_push_string((ctx),(value))
#define duk_get_int(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_int(ctx,value) duk_push_int((ctx),(value))
#define duk_get_short(ctx,idx) duk_require_int((ctx),(idx))
#define duk_push_short(ctx,value) duk_push_int((ctx),(value))
static DBusConnection* duk_get_DBusConnection_pt(duk_context* ctx, duk_idx_t idx);
#define duk_push_DBusConnection_pt(ctx,value) memcpy(duk_push_fixed_buffer(ctx,sizeof(DBusConnection*)),&(value),sizeof(DBusConnection*))
static DBusMessage* duk_get_DBusMessage_pt(duk_context* ctx, duk_idx_t idx);
#define duk_push_DBusMessage_pt(ctx,value) memcpy(duk_push_fixed_buffer(ctx,sizeof(DBusMessage*)),&(value),sizeof(DBusMessage*))

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

static DBusConnection* duk_get_DBusConnection_pt(duk_context* ctx, duk_idx_t idx) {
	DBusConnection* value;
	memcpy(&value, duk_require_buffer_data(ctx, idx, NULL), sizeof(DBusConnection*));
	return value;
}

static DBusMessage* duk_get_DBusMessage_pt(duk_context* ctx, duk_idx_t idx) {
	DBusMessage* value;
	memcpy(&value, duk_require_buffer_data(ctx, idx, NULL), sizeof(DBusMessage*));
	return value;
}

/* BEGIN CUSTOM USER CODE */
#define log_push(...) //fprintf(stderr, __VA_ARGS__)
#define log_get(...) //fprintf(stderr, __VA_ARGS__)

// Helpers
static const char* duk_get_field(duk_context* ctx, int idx, const char* field) {
	duk_get_prop_string(ctx, idx, field);

	const char* type = duk_get_char_pt(ctx, -1);

	duk_pop(ctx); 

	return type;
}

static const char* dbus_get_signature(duk_context* ctx, const char* type) {
	if (!strcmp(type, "ARRAY")) {
		return DBUS_TYPE_ARRAY_AS_STRING;
	}
	else if (!strcmp(type, "BOOLEAN")) {
		return DBUS_TYPE_BOOLEAN_AS_STRING;
	}
	else if (!strcmp(type, "BYTE")) {
		return DBUS_TYPE_BYTE_AS_STRING;
	}
	else if (!strncmp(type, "DICT_ENTRY<", 10)) {
		const char* key_type_p = strstr(type, "<") + 1;
		const char* value_type_p = strstr(type, ",") + 1;
		const char* close_p = strstr(type, ">");

		char key_type[256];
		size_t key_type_len = value_type_p - key_type_p - 1;
		strncpy(key_type, key_type_p, key_type_len);
		key_type[key_type_len] = 0;

		char value_type[256];
		size_t value_type_len = close_p - value_type_p;
		strncpy(value_type, value_type_p, value_type_len);
		value_type[value_type_len] = 0;

		const char *key_signature = dbus_get_signature(ctx, key_type);
		const char *value_signature = dbus_get_signature(ctx, value_type);

		size_t signature_size = 3 + strlen(key_signature) + strlen(value_signature);
		char* signature = (char*)joshi_mblock_alloc(ctx, signature_size);

		snprintf(signature, signature_size, "%s%s%s%s",
			DBUS_DICT_ENTRY_BEGIN_CHAR_AS_STRING, key_signature, value_signature,
			DBUS_DICT_ENTRY_END_CHAR_AS_STRING);

		return signature;
	}
	if (!strcmp(type, "DOUBLE")) {
		return DBUS_TYPE_DOUBLE_AS_STRING;
	}
	if (!strcmp(type, "INT16")) {
		return DBUS_TYPE_INT16_AS_STRING;
	}
	if (!strcmp(type, "INT32")) {
		return DBUS_TYPE_INT32_AS_STRING;
	}
	if (!strcmp(type, "INT64")) {
		return DBUS_TYPE_INT64_AS_STRING;
	}
	if (!strcmp(type, "OBJECT_PATH")) {
		return DBUS_TYPE_OBJECT_PATH_AS_STRING;
	}
	if (!strcmp(type, "SIGNATURE")) {
		return DBUS_TYPE_SIGNATURE_AS_STRING;
	}
	if (!strcmp(type, "STRING")) {
		return DBUS_TYPE_STRING_AS_STRING;
	}
	if (!strcmp(type, "STRUCT<")) {
		char* signature = (char*)joshi_mblock_alloc(ctx, 3 + strlen(type));
		char* token = (char*)joshi_mblock_alloc(ctx, strlen(type));

		signature[0] = DBUS_STRUCT_BEGIN_CHAR;

		const char* p = type + 7;
		const char* q;

		while(q = strstr(p, ",")) {
			strcpy(token, p);
			token[q-p] = 0;

			strcat(signature, dbus_get_signature(ctx, token));

			p = q;
		}

		strcat(signature, DBUS_STRUCT_END_CHAR_AS_STRING);

		return signature;
	}
	if (!strcmp(type, "UINT16")) {
		return DBUS_TYPE_UINT16_AS_STRING;
	}
	if (!strcmp(type, "UINT32")) {
		return DBUS_TYPE_UINT32_AS_STRING;
	}
	if (!strcmp(type, "UINT64")) {
		return DBUS_TYPE_UINT64_AS_STRING;
	}
	if (!strcmp(type, "UNIX_FD")) {
		return DBUS_TYPE_UNIX_FD_AS_STRING;
	}
	else if (!strcmp(type, "VARIANT")) {
		return DBUS_TYPE_VARIANT_AS_STRING;
	}

	fprintf(stderr, "dbus_get_signature: unknown signature for type: %s\n", type);
	return "?";
}

// Pushers
static void duk_push_dbus_any(duk_context* ctx, DBusMessageIter* iter);

static void duk_push_dbus_array(duk_context* ctx, DBusMessageIter* iter);
static void duk_push_dbus_basic(duk_context* ctx, DBusMessageIter* iter);
static void duk_push_dbus_dict_entry(duk_context* ctx, DBusMessageIter* iter);
static void duk_push_dbus_struct(duk_context* ctx, DBusMessageIter* iter);
static void duk_push_dbus_variant(duk_context* ctx, DBusMessageIter* iter);

static void duk_push_dbus_any(duk_context* ctx, DBusMessageIter* iter) {
	char type = dbus_message_iter_get_arg_type(iter);

	log_push("[%p] push_any %c\n", iter, type);

	switch (type) {
		case DBUS_TYPE_ARRAY:      duk_push_dbus_array(ctx, iter); break;
		case DBUS_TYPE_DICT_ENTRY: duk_push_dbus_dict_entry(ctx, iter); break;
		case DBUS_TYPE_STRUCT:     duk_push_dbus_struct(ctx, iter); break;
		case DBUS_TYPE_VARIANT:    duk_push_dbus_variant(ctx, iter); break;
		default:                   duk_push_dbus_basic(ctx, iter); break;
	}
}

static void duk_push_dbus_array(duk_context* ctx, DBusMessageIter* iter) {
	DBusMessageIter sub_iter;
	dbus_message_iter_recurse(iter, &sub_iter);

	duk_idx_t i = 0;

	duk_push_array(ctx);
	log_push("[%p] pushed array\n", &sub_iter);

	do {
		duk_push_dbus_any(ctx, &sub_iter);
		duk_put_prop_index(ctx, -2, i);
		log_push("[%p] set [%d]\n", &sub_iter, i);
		i++;
	}
	while (dbus_message_iter_next(&sub_iter));
}

static void duk_push_dbus_basic(duk_context* ctx, DBusMessageIter* iter) {
	char type = dbus_message_iter_get_arg_type(iter);

	log_push("[%p] push_basic %c\n", iter, type);

	DBusBasicValue value;
	dbus_message_iter_get_basic(iter, &value);

	switch (type) {
		case DBUS_TYPE_BOOLEAN:     duk_push_boolean(ctx, value.bool_val); break;
		case DBUS_TYPE_BYTE:        duk_push_number(ctx, value.byt); break;
		case DBUS_TYPE_DOUBLE:      duk_push_number(ctx, value.dbl); break;
		case DBUS_TYPE_INT16:       duk_push_number(ctx, value.i16); break;
		case DBUS_TYPE_INT32:       duk_push_number(ctx, value.i32); break;
		case DBUS_TYPE_INT64:       duk_push_number(ctx, value.i64); break;
		case DBUS_TYPE_OBJECT_PATH: duk_push_string(ctx, value.str); break;
		case DBUS_TYPE_SIGNATURE:   duk_push_string(ctx, value.str); break;
		case DBUS_TYPE_STRING:      duk_push_string(ctx, value.str); break;
		case DBUS_TYPE_UINT16:      duk_push_number(ctx, value.u16); break;
		case DBUS_TYPE_UINT32:      duk_push_number(ctx, value.u32); break;
		case DBUS_TYPE_UINT64:      duk_push_number(ctx, value.u64); break;
		case DBUS_TYPE_UNIX_FD:     duk_push_number(ctx, value.fd); break;

		default:
			fprintf(stderr, "duk_push_dbus_basic: unsupported type %c\n", type);
			duk_push_undefined(ctx);
			break;
	}
}

static void duk_push_dbus_dict_entry(duk_context* ctx, DBusMessageIter* iter) {
	DBusMessageIter sub_iter;
	dbus_message_iter_recurse(iter, &sub_iter);

	duk_push_object(ctx);
	duk_push_string(ctx, "DICT_ENTRY");
	duk_put_prop_string(ctx, -2, "is_a");
	log_push("[%p] pushed object\n", &sub_iter);

	duk_push_dbus_any(ctx, &sub_iter);
	duk_put_prop_string(ctx, -2, "key");
	log_push("[%p] set 'key'\n", &sub_iter);

	dbus_message_iter_next(&sub_iter);

	duk_push_dbus_any(ctx, &sub_iter);
	duk_put_prop_string(ctx, -2, "value");
	log_push("[%p] set 'value'\n", &sub_iter);
}

static void duk_push_dbus_struct(duk_context* ctx, DBusMessageIter* iter) {
	DBusMessageIter sub_iter;
	dbus_message_iter_recurse(iter, &sub_iter);

	duk_idx_t i = 0;

	duk_push_array(ctx);
	log_push("[%p] pushed array\n", &sub_iter);

	do {
		duk_push_dbus_any(ctx, &sub_iter);
		duk_put_prop_index(ctx, -2, i);
		log_push("[%p] set [%d]\n", &sub_iter, i);
		i++;
	}
	while (dbus_message_iter_next(&sub_iter));
}

static void duk_push_dbus_variant(duk_context* ctx, DBusMessageIter* iter) {
	DBusMessageIter sub_iter;
	dbus_message_iter_recurse(iter, &sub_iter);

	duk_push_dbus_any(ctx, &sub_iter);
}

// Getters
static void duk_get_dbus_any(duk_context* ctx, int idx, DBusMessageIter* iter);

static void duk_get_dbus_array(duk_context* ctx, int idx, DBusMessageIter* iter);
static void duk_get_dbus_basic(duk_context* ctx, int idx, DBusMessageIter* iter);
static void duk_get_dbus_dict_entry(duk_context* ctx, int idx, DBusMessageIter* iter);
static void duk_get_dbus_struct(duk_context* ctx, int idx, DBusMessageIter* iter);
static void duk_get_dbus_variant(duk_context* ctx, int idx, DBusMessageIter* iter);

static void duk_get_dbus_any(duk_context* ctx, int idx, DBusMessageIter* iter) {
	const char* type = duk_get_field(ctx, idx, "type");

	log_get("[%p] get_any %s\n", iter, type);

	if      (!strcmp(type, "ARRAY"))            duk_get_dbus_array(ctx, idx, iter);
	else if (!strncmp(type, "DICT_ENTRY<", 11)) duk_get_dbus_dict_entry(ctx, idx, iter);
	else if (!strncmp(type, "STRUCT<", 7))      duk_get_dbus_struct(ctx, idx, iter);
	else if (!strcmp(type, "VARIANT"))          duk_get_dbus_variant(ctx, idx, iter);
	else                                        duk_get_dbus_basic(ctx, idx, iter);
}

static void duk_get_dbus_array(duk_context* ctx, int idx, DBusMessageIter* iter) {
	const char* item_type = duk_get_field(ctx, idx, "item_type");

	duk_get_prop_literal(ctx, idx, "items");

	duk_size_t len = duk_get_length(ctx, -1);

	log_get("[%p] get_array <%s> [%d]\n", iter, item_type, len);

	const char* signature = dbus_get_signature(ctx, item_type);

	DBusMessageIter sub;
	dbus_message_iter_open_container(iter, DBUS_TYPE_ARRAY, signature, &sub);

	for (duk_idx_t i = 0; i < len; i++) {
		duk_get_prop_index(ctx, -1, i);
		duk_get_dbus_any(ctx, -1, &sub);
		duk_pop(ctx);
	}

	dbus_message_iter_close_container(iter, &sub);
}

static void duk_get_dbus_basic(duk_context* ctx, int idx, DBusMessageIter* iter) {
	const char* basic_type = duk_get_field(ctx, idx, "type");

	log_get("[%p] get_basic %s\n", iter, basic_type);

	int type;
	DBusBasicValue value;
		
	duk_get_prop_literal(ctx, idx, "value");

	if (!strcmp(basic_type, "BOOLEAN")) {
		type = DBUS_TYPE_BOOLEAN;
		value.bool_val = duk_get_boolean(ctx, -1);
	} else if (!strcmp(basic_type, "BYTE")) {
		type = DBUS_TYPE_BYTE;
		value.byt = duk_get_number(ctx, -1);
	} else if (!strcmp(basic_type, "DOUBLE")) {
		type = DBUS_TYPE_DOUBLE;
		value.dbl = duk_get_number(ctx, -1);
	} else if (!strcmp(basic_type, "INT16")) {
		type = DBUS_TYPE_INT16;
		value.i16 = duk_get_number(ctx, -1);
	} else if (!strcmp(basic_type, "INT32")) {
		type = DBUS_TYPE_INT32;
		value.i32 = duk_get_number(ctx, -1);
	} else if (!strcmp(basic_type, "INT64")) {
		type = DBUS_TYPE_INT64;
		value.i64 = duk_get_number(ctx, -1);
	} else if (!strcmp(basic_type, "OBJECT_PATH")) {
		type = DBUS_TYPE_OBJECT_PATH;
		value.str = (char*)duk_get_char_pt(ctx, -1);
	} else if (!strcmp(basic_type, "UINT16")) {
		type = DBUS_TYPE_UINT16;
		value.u16 = duk_get_number(ctx, -1);
	} else if (!strcmp(basic_type, "UINT32")) {
		type = DBUS_TYPE_UINT32;
		value.u32 = duk_get_number(ctx, -1);
	} else if (!strcmp(basic_type, "UINT64")) {
		type = DBUS_TYPE_UINT64;
		value.u64 = duk_get_number(ctx, -1);
	} else if (!strcmp(basic_type, "SIGNATURE")) {
		type = DBUS_TYPE_SIGNATURE;
		value.str = (char*)duk_get_char_pt(ctx, -1);
	} else if (!strcmp(basic_type, "STRING")) {
		type = DBUS_TYPE_STRING;
		value.str = (char*)duk_get_char_pt(ctx, -1);
	} else if (!strcmp(basic_type, "UNIX_FD")) {
		type = DBUS_TYPE_UNIX_FD;
		value.fd = duk_get_number(ctx, -1);
	}
	else {
		fprintf(stderr, "duk_get_dbus_basic: unsupported type found %s, \n", basic_type);
		type = DBUS_TYPE_BOOLEAN;
		value.bool_val = 0;
	}

	dbus_message_iter_append_basic(iter, type, &value);
	duk_pop(ctx);
}

static void duk_get_dbus_dict_entry(duk_context* ctx, int idx, DBusMessageIter* iter) {
	log_get("[%p] get_dict_entry\n", iter);

	DBusMessageIter sub;
	dbus_message_iter_open_container(iter, DBUS_TYPE_DICT_ENTRY, NULL, &sub);

	duk_get_prop_string(ctx, idx, "key");
	duk_get_dbus_any(ctx, -1, &sub);
	duk_pop(ctx);

	duk_get_prop_string(ctx, idx, "value");
	duk_get_dbus_any(ctx, -1, &sub);
	duk_pop(ctx);

	dbus_message_iter_close_container(iter, &sub);
}

static void duk_get_dbus_struct(duk_context* ctx, int idx, DBusMessageIter* iter) {
	duk_get_prop_literal(ctx, idx, "values");

	duk_size_t len = duk_get_length(ctx, -1);

	log_get("[%p] get_struct [%d]\n", iter, len);

	DBusMessageIter sub;
	dbus_message_iter_open_container(iter, DBUS_TYPE_STRUCT, NULL, &sub);

	for (duk_idx_t i = 0; i < len; i++) {
		duk_get_prop_index(ctx, -1, i);
		duk_get_dbus_any(ctx, -1, &sub);
		duk_pop(ctx);
	}

	dbus_message_iter_close_container(iter, &sub);
}

static void duk_get_dbus_variant(duk_context* ctx, int idx, DBusMessageIter* iter) {
	log_get("[%p] get_variant\n", iter);

	duk_get_prop_string(ctx, idx, "value");

	const char* signature = dbus_get_signature(ctx, duk_get_field(ctx, -1, "type"));

	DBusMessageIter sub;
	dbus_message_iter_open_container(iter, DBUS_TYPE_VARIANT, signature, &sub);

	duk_get_dbus_any(ctx, -1, &sub);
	duk_pop(ctx);

	dbus_message_iter_close_container(iter, &sub);
}

static duk_ret_t _js_call(duk_context* ctx) {
	const int timeout = duk_get_int(ctx, 0);
	DBusConnection* conn = duk_get_DBusConnection_pt(ctx, 1);
	const char* destination = duk_get_char_pt(ctx, 2);
	const char* path = duk_get_char_pt(ctx, 3);
	const char* iface = duk_get_char_pt(ctx, 4);
	const char* method = duk_get_char_pt(ctx, 5);
	const int args_index = 6;

	// Avoid NPEs
	if (!destination) destination = "";
	if (!path) path = "";
	if (!iface) iface = "";
	if (!method) method = "";

	// Create message
	DBusMessage* msg = dbus_message_new_method_call(destination, path, iface, method);

	// Add arguments
	duk_size_t len = duk_get_length(ctx, args_index);

	DBusMessageIter args;
	dbus_message_iter_init_append(msg, &args);

	for (duk_idx_t i = 0; i < len; i++) {
		duk_get_prop_index(ctx, args_index, i);
		duk_get_dbus_any(ctx, -1, &args);
		duk_pop(ctx);
	}

	// Call method
	DBusError err;
	dbus_error_init(&err);

	DBusMessage* reply = dbus_connection_send_with_reply_and_block(conn, msg, timeout, &err);
	if (!reply) {
		duk_push_error_object(ctx, DUK_ERR_ERROR, err.message);
		dbus_error_free(&err);

		dbus_message_unref(msg);
		joshi_mblock_free_all(ctx);
		return duk_throw(ctx);
	}

	// Return values
	DBusMessageIter rets;

	if (!dbus_message_iter_init(reply, &rets)) {
		duk_push_undefined(ctx);
	}
	else {
		duk_idx_t i = 0;

		duk_push_array(ctx);

		do {
			duk_push_dbus_any(ctx, &rets);
			duk_put_prop_index(ctx, -2, i++);
		}
		while (dbus_message_iter_next(&rets));
	}

	// Free memory
	dbus_message_unref(reply);
	dbus_message_unref(msg);
	joshi_mblock_free_all(ctx);

	return 1;
}

static duk_ret_t _js_close(duk_context* ctx) {
	DBusConnection* conn = duk_get_DBusConnection_pt(ctx, 0);

	dbus_connection_unref(conn);

	joshi_mblock_free_all(ctx);
	return 0;
}

static duk_ret_t _js_open(duk_context* ctx) {
	int type = duk_get_int(ctx, 0);

	DBusError err;
	dbus_error_init(&err);

	DBusConnection* conn = dbus_bus_get(type, &err);

	if (!conn) { 
		duk_push_error_object(ctx, DUK_ERR_ERROR, err.message);
		dbus_error_free(&err);
		duk_throw(ctx);
	}

	duk_push_DBusConnection_pt(ctx, conn);

	joshi_mblock_free_all(ctx);
	return 1;
}
/* END CUSTOM USER CODE */

JOSHI_FN_DECL joshi_fn_decls[] = {
	{ name: "call", func: _js_call, argc: 7 },
	{ name: "close", func: _js_close, argc: 1 },
	{ name: "open", func: _js_open, argc: 1 },
};

size_t joshi_fn_decls_count = 3;