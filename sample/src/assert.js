/*
 * Custom assertion and messages class
 */

const message = require("./message/message.js");
const evaluator = require("./condition.js");

const replaceTokens = require("./message/message.js").replaceTokens;

const otherReplaceTokens = message.replaceTokens;

/*
 * Default messages
 */
const MSG_ASSERT_TYPE =
	"Wrong type for '%varName%', expected %type%, got %_TYPE_%(?funName in %funName%?)";
const MSG_ASSERT_VALUE =
	"Wrong value for '%varName%', expected %expected%, got %_ACTUAL_%(?funName in %funName%?)";
const MSG_ASSERT_FIELD_TYPES =
	"Wrong type for field '%field%' of '%varName%', expected %type%, got %actual%(?funName in %funName%?)";
const MSG_ASSERT_FIELD_VALUES =
	"Wrong value for field '%field%' of '%varName%', expected %expected%, got %_ACTUAL_%(?funName in %funName%?)";
const MSG_ASSERT_OPTIONAL_FIELD_TYPES =
	"Wrong type for field '%field%' of '%varName%', expected %type%, got %_ACTUAL_%(?funName in %funName%?)";
const MSG_ASSERT_OPTIONAL_FIELD_VALUES =
	"Wrong value for field '%field%' of '%varName%', expected %expected%, got %_ACTUAL_%(?funName in %funName%?)";
const MSG_ASSERT_ALLOWED_FIELDS =
	"Unexpected field '%field%' in '%varName%'(?funName in %funName%?)";
const MSG_ASSERT_FORBIDDEN_FIELDS =
	"Field '%field%' not allowed in '%varName%'(?funName in %funName%?)";

class Assert {

	constructor () {
		/* Default values to be used in case values are missing from assertion options */
		this.defaultOptions = {
			stackDepth: 2
		};
		this.defaultTokens = {
			varName: "argument"
		};
	}

	/*
	 * Complete object `o` with default values from `defaults` object
	 */
	_applyDefaults (o, defaults) {
		for (let i in defaults) {
			if (o[i] === undefined)
				o[i] = defaults[i];
		}
		return o;
	}

	/*
	 * Apply default options stored in this instance
	 */
	_applyDefaultOptions (o) {
		return this._applyDefaults(o, this.defaultOptions);
	}

	/*
	 * Apply default tokens stored in this instance
	 */
	_applyDefaultTokens (o) {
		return this._applyDefaults(o, this.defaultTokens);
	}

	/*
	 * Check `result` and throw new `errorClass` error if result is false
	 * The `tokens` object contains the token values to be replaced in the message
	 */
	_runAssertion (result, errorClass, options, tokens) {
		if (result)
			return true;
		options = JSON.parse(JSON.stringify(options));
		tokens = JSON.parse(JSON.stringify(tokens));
		this._applyDefaultOptions(options);
		this._applyDefaultTokens(tokens);

		let msg = message.replaceTokens(options.message, tokens);
		let err = new errorClass(msg);

		let stack = err.stack.split("\n");
		stack.splice(1, options.stackDepth);
		err.stack = stack.join("\n");

		throw(err);
	}

	/*
	 * Argument-level assertions
	 */

	/*
	 * Check that a single value is of the specified type or types
	 * `value`: any type, value to check
	 * `type`: string or array of strings, list of acceptable types
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	_assertType (value, type, errorClass, varName, funName) {
		if (errorClass === undefined)
			errorClass = Error;
		if (!(type instanceof Array))
			type = [ type ];
		return this._runAssertion(type.indexOf(typeof(value)) !== -1, errorClass, {
			message: this.assertType.message
		}, {
			value: value,
			type: type.join("/"),
			varName: varName,
			funName: funName
		});
	}

	/*
	 * Check that a single value is valid according to condition
	 * `value`: any type, value to check
	 * `condition`: condition object or array of condition objects describing a valid value
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 * `stackDepth`: number, extra stack depth to add on top of the default stack depth
	 */
	_assertValue (value, condition, errorClass, varName, funName, stackDepth) {
		if (errorClass === undefined)
			errorClass = Error;
		if (stackDepth === undefined)
			stackDepth = 0;
		let res = evaluator.evaluateValueCondition(value, condition);
		return this._runAssertion(res.result, errorClass, {
			message: this.assertValue.message,
			stackDepth: this.defaultOptions.stackDepth + stackDepth
		}, {
			value: value,
			expected: res.details,
			actual: res.actual,
			varName: varName,
			funName: funName
		});
	}

	/*
	 * Assertions on object fields
	 */

	/*
	 * Check that all specified fields are of the specified type or types
	 * Missing fields will trigger an assertion error
	 * `value`: object, object to check
	 * `fields`: object, key value pairs specifying the correct type for each field:
	 *     `<fieldName>`: string or array of strings, list of acceptable types
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	_assertFieldTypes (value, fields, errorClass, varName, funName) {
		if (errorClass === undefined)
			errorClass = Error;
		for (let i in fields) {
			let type = fields[i];
			if (!(type instanceof Array))
				type = [ type ];
			let actual = typeof(value[i]);
			if (actual === "undefined")
				actual = "<undefined>";
			this._runAssertion(type.indexOf(typeof(value[i])) !== -1, errorClass, {
				message: this.assertFieldTypes.message
			}, {
				value: value[i],
				type: type.join("/"),
				actual: actual,
				varName: varName,
				field: i,
				funName: funName
			});
		}
		return true;
	}

	/*
	 * Check that all specified fields of object are valid according to individual conditions
	 * Missing fields will trigger an assertion error
	 * `value`: object, object to check
	 * `fields`: object, key value pairs specifying validation condition or conditions for the field:
	 *     `<fieldName>`: object or array of objects, validation condition for field
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	_assertFieldValues (value, fields, errorClass, varName, funName) {
		if (errorClass === undefined)
			errorClass = Error;
		for (let i in fields) {
			let res = evaluator.evaluateValueCondition(value[i], fields[i]);
			this._runAssertion(res.result, errorClass, {
				message: this.assertFieldValues.message
			}, {
				value: value[i],
				expected: res.details,
				actual: res.actual,
				varName: varName,
				field: i,
				funName: funName
			});
		}
		return true;
	}

	/*
	 * Check that all present fields are of the specified type or types
	 * Missing fields will be ignored
	 * `value`: object, object to check
	 * `fields`: object, key value pairs specifying the correct type for each field:
	 *     `<fieldName>`: string or array of strings, list of acceptable types
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	_assertOptionalFieldTypes (value, fields, errorClass, varName, funName) {
		if (errorClass === undefined)
			errorClass = Error;
		for (let i in fields) {
			if (value[i] === undefined)
				continue;
			let type = fields[i];
			if (!(type instanceof Array))
				type = [ type ];
			this._runAssertion(type.indexOf(typeof(value[i])) !== -1, errorClass, {
				message: this.assertFieldTypes.message
			}, {
				value: value[i],
				type: type.join("/"),
				actual: typeof(value[i]),
				varName: varName,
				field: i,
				funName: funName
			});
		}
		return true;
	}

	/*
	 * Check that all specified fields of object are valid according to individual conditions
	 * Missing fields will be ignored
	 * `value`: object, object to check
	 * `fields`: object, key value pairs specifying validation condition or conditions for the field:
	 *     `<fieldName>`: object or array of objects, validation condition for field
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	_assertOptionalFieldValues (value, fields, errorClass, varName, funName) {
		if (errorClass === undefined)
			errorClass = Error;
		for (let i in fields) {
			if (value[i] === undefined)
				continue;
			let res = evaluator.evaluateValueCondition(value[i], fields[i]);
			this._runAssertion(res.result, errorClass, {
				message: this.assertFieldValues.message
			}, {
				value: value[i],
				expected: res.details,
				actual: res.actual === undefined ? "<undefined>" : res.actual,
				varName: varName,
				field: i,
				funName: funName
			});
		}
		return true;
	}

	/*
	 * Check that only the allowed fields are present in object
	 * `value`: object, object to check
	 * `fields`: array of string, names of allowed fields for this object
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	_assertAllowedFields (value, fields, errorClass, varName, funName) {
		if (errorClass === undefined)
			errorClass = Error;
		if (typeof(value) !== "object")
			return;
		for (let i in value) {
			this._runAssertion(fields.indexOf(i) !== -1, errorClass, {
				message: this.assertAllowedFields.message
			}, {
				field: i,
				varName: varName,
				funName: funName
			});
		}
	}

	/*
	 * Check that no forbidden fields are present in object
	 * `value`: object, object to check
	 * `fields`: array of string, names of forbidden fields for this object
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	_assertForbiddenFields (value, fields, errorClass, varName, funName) {
		if (errorClass === undefined)
			errorClass = Error;
		if (typeof(value) !== "object")
			return;
		for (let i in value) {
			this._runAssertion(fields.indexOf(i) === -1, errorClass, {
				message: this.assertForbiddenFields.message
			}, {
				field: i,
				varName: varName,
				funName: funName
			});
		}
	}

	/*
	 * Shorthands for different conditions
	 */

	/*
	 * Check that value equals reference value
	 * `value`: any type, value to check
	 * `reference`: any type, reference value
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertEqual (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { eq: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that value does not equal reference value
	 * `value`: any type, value to check
	 * `reference`: any type, reference value
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertNotEqual (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { neq: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that value is strictly less than reference value
	 * `value`: string or number, value to check
	 * `reference`: string or number, reference value
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertLt (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { lt: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that value is less than or equal to reference value
	 * `value`: any type, value to check
	 * `reference`: any type, reference value
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertLte (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { lte: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that value is strictly greater than reference value
	 * `value`: string or number, value to check
	 * `reference`: string or number, reference value
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertGt (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { gt: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that value is greater than or equal to reference value
	 * `value`: string or number, value to check
	 * `reference`: string or number, reference value
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertGte (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { gte: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that value is strictly integer or float
	 * `value`: number, value to check
	 * `reference`: boolean, `true` for integer, `false` for float, defaults to `true`
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertInteger (value, reference, errorClass, varName, funName) {
		if (reference === undefined)
			reference = true;
		return this._assertValue(value, { integer: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that value divides a reference value exactly
	 * `value`: number, value to check
	 * `reference`: number, reference number
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertDivides (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { divides: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that value is an exact multiple of the reference value
	 * `value`: number, value to check
	 * `reference`: number, reference number
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertMultiple (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { multiple: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that a string contains a substring
	 * `value`: string, string to check
	 * `reference`: string, reference substring
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertContains (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { contains: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that a string begins with a substring
	 * `value`: string, string to check
	 * `reference`: string, reference substring
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertBegins (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { begins: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that a string ends with a substring
	 * `value`: string, string to check
	 * `reference`: string, reference substring
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertEnds (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { ends: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that string matches regexp
	 * `value`: string, string to check
	 * `reference`: string or RegExp object, regexp to match
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertMatches (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { matches: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that a string does not contain reference substring
	 * `value`: string, string to check
	 * `reference`: string, reference substring
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertContainsNot (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { containsNot: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that a string does not begin with reference substring
	 * `value`: string, string to check
	 * `reference`: string, reference substring
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertBeginsNot (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { beginsNot: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that a string does not end with reference substring
	 * `value`: string, string to check
	 * `reference`: string, reference substring
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertEndsNot (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { endsNot: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that string does not match regexp
	 * `value`: string, string to check
	 * `reference`: string or RegExp object, regexp the string shouldn't match
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertMatchesNot (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { matchesNot: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that length of string or array matches condition
	 * `value`: string or array, the item to check the length of
	 * `reference`: condition object or number, length should match this condition
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertLength (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { length: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * Check that each element of an array matches condition
	 * `value`: array, the array to check the elements of
	 * `reference`: condition object, condition all elements should match
	 * `errorClass`: class, error class to use for thrown error (defaults to Error)
	 * `varName`: string, original variable or argument name that is being asserted (for error message),
	 *            defaults to `argument`
	 * `funName`: string, original function name where this assertion was called (for error message)
	 *            defaults to `undefined`, which does not appear in the default error message
	 */
	assertEach (value, reference, errorClass, varName, funName) {
		return this._assertValue(value, { each: reference }, errorClass, varName, funName, 1);
	}

	/*
	 * @alias assertEach
	 */
	assertElements (value, reference, errorClass, varName, funName) {
		return this.assertEach(value, reference, errorClass, varName, funName);
	}

}

const prototypeCall = function(fn, ref) {
	return fn.bind(ref);
};

/*
 * Get a new, independent instance of the Assert class
 * The new instance can have custom messages assigned to it
 * @parse
 */
const getInstance = function() {
	let ret = new Assert();

	// create instance-specific calls so we can assign messages to them
	// @rename instance arg[0]/_[a-zA-Z0-9]+$/ target/\.[a-zA-Z0-9]+$/
	ret.assertType = prototypeCall(ret._assertType, ret);
	ret.assertValue = prototypeCall(ret._assertValue, ret);
	ret.assertFieldTypes = prototypeCall(ret._assertFieldTypes, ret);
	ret.assertFieldValues = prototypeCall(ret._assertFieldValues, ret);
	ret.assertOptionalFieldTypes = prototypeCall(ret._assertOptionalFieldTypes, ret);
	ret.assertOptionalFieldValues = prototypeCall(ret._assertOptionalFieldValues, ret);
	ret.assertAllowedFields = prototypeCall(ret._assertAllowedFields, ret);
	ret.assertForbiddenFields = prototypeCall(ret._assertForbiddenFields, ret);

	// setup aliases for instance
	// @alias instance value/\.[a-zA-Z0-9]+$/ target/\.[a-zA-Z0-9]+$/
	ret.type = ret.assertType;
	ret.value = ret.assertValue;
	ret.fieldTypes = ret.assertFieldTypes;
	ret.fieldValues = ret.assertFieldValues;
	ret.optionalTypes = ret.assertOptionalFieldTypes;
	ret.optionalValues = ret.assertOptionalFieldValues;
	ret.allowedFields = ret.assertAllowedFields;
	ret.forbiddenFields = ret.assertForbiddenFields;

	// @alias instance value/\.[a-zA-Z0-9]+$/ target/\.[a-zA-Z0-9]+$/
	ret.eq = ret.assertEqual;
	ret.equal = ret.assertEqual;
	ret.neq = ret.assertNotEqual;
	ret.notEqual = ret.assertNotEqual;
	ret.lt = ret.assertLt;
	ret.lte = ret.assertLte;
	ret.gt = ret.assertGt;
	ret.gte = ret.assertGte;
	ret.integer = ret.assertInteger;
	ret.divides = ret.assertDivides;
	ret.multiple = ret.assertMultiple;
	ret.contains = ret.assertContains;
	ret.begins = ret.assertBegins;
	ret.ends = ret.assertEnds;
	ret.matches = ret.assertMatches;
	ret.containsNot = ret.assertContainsNot;
	ret.beginsNot = ret.assertBeginsNot;
	ret.endsNot = ret.assertEndsNot;
	ret.matchesNot = ret.assertMatchesNot;
	ret.length = ret.assertLength;
	ret.each = ret.assertEach;

	// setup default messages for instance
	// @assign instance value/\.[a-zA-Z0-9]+$/ target
	ret.assertType.message = MSG_ASSERT_TYPE;
	ret.assertValue.message = MSG_ASSERT_VALUE;
	ret.assertFieldTypes.message = MSG_ASSERT_FIELD_TYPES;
	ret.assertFieldValues.message = MSG_ASSERT_FIELD_VALUES;
	ret.assertOptionalFieldTypes.message = MSG_ASSERT_OPTIONAL_FIELD_TYPES;
	ret.assertOptionalFieldValues.message = MSG_ASSERT_OPTIONAL_FIELD_VALUES;
	ret.assertAllowedFields.message = MSG_ASSERT_ALLOWED_FIELDS;
	ret.assertForbiddenFields.message = MSG_ASSERT_FORBIDDEN_FIELDS;

	return ret;
};

/*
 * Singleton pattern instance of the Assert class
 */
const instance = getInstance();

function testFunction(arg1, arg2, arg3) {
	if (arg1)
		arg2 += arg3;
	return "just a test"
}

class TestClass extends Assert {

	constructor () {
		console.log("just a test");
	}

}

// although we are using singleton pattern, maybe we want a second instance for
// who knows what specific custom purpose
instance.new = getInstance;

// @pattern singleton
// @export Assert
module.exports = instance;
module.exports.testFunction = testFunction;
module.exports.Assert = Assert;
