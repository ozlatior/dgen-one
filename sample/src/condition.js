/*
 * Condition evaluation functions
 *
 * Description for this file
 *
 * Intro for this file.
 * This intro contains extra information for the user, and so do subseqeunt comments
 * before the first function/class/variable comment.
 *
 * This is a new paragraph.
 */

/*
 * Conditions are in object form;
 * If conditions or values are in an array, it means either of the conditions have to be fullfilled
 * The object field specifies the condition operator or type, eg
 * - `{ gte: 4, lte: 10, integer: true }` - between 4 and 10 inclusively, integer
 * - `{ eq: [ 1, 5, 10 ] }` - either of the values 1, 5 or 10
 * - `[ { eq: false }, { integer: true, gte: 0 } ]` - either `false` or any non-negative integer
 * Some properties can be specified through a condition:
 * - `{ length: { gte: 10, lte: 20 } }` - check that string length is between 10 and 20
 *
 * Condition list:
 * - `type`: string, input type equals value
 * - `eq`: number/string/boolean, equals value
 * - `neq`: number/string/boolean, does not equal value
 * - `lt`, `lte`, `gt`, `gte`: number, less/greater than (or equal to) value
 * - `integer`: boolean, if specified, forces value to be integer or to not be integer
 * - `divides`: number, true if the value is a natural divisor of specified number
 * - `multiple`: number, true if the value is a multiple of specified number
 * - `contains`: string/any, check that the value contains specified string or value
 * - `begins`: string/any, check that the value begins with specified string or value
 * - `ends`: string/any, check that the value ends with specified string or value
 * - `matches`: string or regexp, check that the value matches specified regexp
 * - `containsNot`: string/any, check that the value does not contain specified string or value
 * - `beginsNot`: string/any, check that the value does not begin with specified string or value
 * - `endsNot`: string/any, check that the value does not end with specified string or value
 * - `matchesNot`: string or regexp, check that the value does not match specified regexp
 * - `length`: condition object, check that the string or array length validates condition object
 * - `each`: condition object, run condition object for each element of an array
 */

/*
 * Convert to string
 *
 *
 * Convert a value to string for messages
 * - `value`: any type, value to convert to string
 * - `stringify`: boolean, call stringify on elements (defaults to true)
 * Returns the converted string.
 */
const convertToString = function(value, stringify) {
	if (value instanceof RegExp)
		return value.toString();
	if (stringify || stringify === undefined)
		return JSON.stringify(value);
	return value;
};

/*
 * Join List
 * Join an array as if it was a list of values
 * - `list`: array, array to join
 * - `option`: object:
 *   - `stringify`: boolean, call stringify on elements (defaults to true)
 *   - `last`: string, sequence to use for last element (defaults to " or ")
 *   - `separator`: string, sequence to use as separator (defaults to ", ")
 * Returns a formatted string, such as [ 1, 2, 3 ] => "1, 2 or 3"
 */
const joinList = function(list, options) {
	if (options === undefined)
		options = {};
	if (options.stringify === undefined)
		options.stringify = true;
	if (!(list instanceof Array))
		return "" + convertToString(list, options.stringify);
	if (list.length === 0)
		return "<empty list>";
	list = list.map((a) => convertToString(a, options.stringify));
	if (list.length === 1)
		return "" + list[1];
	if (options.last === undefined)
		options.last = " or ";
	if (options.separator === undefined)
		options.separator = ", ";
	let lastElement = list.pop();
	return list.join(options.separator) + options.last + lastElement;
};

/*
 * Build a list of reference values from multiple conditions output
 */
const referenceList = function(list) {
	let ret = {};
	for (let i=0; i<list.length; i++) {
		let key = list[i].what;
		let value = list[i].reference;
		if (ret[key] === undefined) {
			ret[key] = value;
			continue;
		}
		if (!(ret[key] instanceof Array))
			ret[key] = [ ret[key] ];
		if (value instanceof Array)
			ret[key] = ret[key].concat(value);
		else
			ret[key].push(value);
	}
	return ret;
};

/*
 * Check that a condition is nested
 */
const isNestedCondition = function(condition) {
	switch (condition) {
		case "length":
		case "each":
		case "none":
			return true;
	}
	return false;
};

/*
 * Check that a condition is negative
 */
const isNegativeCondition = function(condition) {
	switch (condition) {
		case "neq":
		case "containsNot":
		case "beginsNot":
		case "endsNot":
		case "matchesNot":
			return true;
	}
	return false;
};

/*
 * Check that a number is integer
 */
const isInteger = function(number) {
	return number === parseInt(number);
};

/*
 * Check that a number is exact divisor of another
 * - `value`: number, the divisor
 * - `multiple`: number, the multiple
 */
const isDivisor = function(value, multiple) {
	if (value === 0)
		return false;
	return isInteger(multiple / value);
};

/*
 * Evaluate a single condition
 * - `condition`: string, name of condition to evaluate
 * - `value`: any type, actual value
 * - `reference`: any type, value or array of possible reference values
 * Returns an object:
 * - `result`: boolean, true if evaluation was positive
 * - `actual`: any type, the actual value
 * - `details`: string, a short text explaining the reference value
 */
const evaluateSingle = function(condition, value, reference) {
	// if reference is an array, check that any of the values is a match
	if (reference instanceof Array && !isNestedCondition(condition)) {
		let res;
		if (isNegativeCondition(condition)) {
			// if condition is negative, all must evaluate true for a true result
			for (let i=0; i<reference.length; i++) {
				res = evaluateSingle(condition, value, reference[i]);
				if (res.result === false)
					return res;
			}
			return { result: true }
		}
		else {
			// if condition is positive, only one must evaluate true for a true result
			for (let i=0; i<reference.length; i++) {
				res = evaluateSingle(condition, value, reference[i]);
				if (res.result === true)
					return { result: true }
			}
			return res;
		}
	}

	// depending on condition, run the evaluation
	switch (condition) {
		case "type":
			if (typeof(value) === reference)
				return { result: true }
			return {
				result: false,
				actual: typeof(value),
				details: "type %reference%"
			}
		case "eq":
			if (value === reference)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "%reference%"
			}
		case "neq":
			if (value !== reference)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "not %reference%"
			}
		case "lt":
			if (value < reference)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "less than %reference%"
			}
		case "lte":
			if (value <= reference)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "less than or equal to %reference%"
			}
		case "gt":
			if (value > reference)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "greater than %reference%"
			}
		case "gte":
			if (value >= reference)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "greater than or equal to %reference%"
			}
		case "integer":
			if (typeof(value) === "number" && isInteger(value) === reference)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: (reference === false ? "non-" : "")+"integer number"
			}
		case "divides":
			if (typeof(value) === "number" && isDivisor(value, reference))
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "exact divisor of %reference%"
			}
		case "multiple":
			if (typeof(value) === "number" && isDivisor(reference, value))
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "exact multiple of %reference%"
			}
		case "contains":
			if (typeof(value) === "string" && value.indexOf(reference) !== -1)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "string containing %reference%"
			}
		case "begins":
			if (typeof(value) === "string" && value.indexOf(reference) === 0)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "string beginning with %reference%"
			}
		case "ends":
			if (typeof(value) === "string" && value.slice(-reference.length) === reference)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "string ending with %reference%"
			}
		case "matches":
			if (!(reference instanceof RegExp))
				reference = new RegExp(reference);
			if (typeof(value) === "string" && value.match(reference) !== null)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "string matching %reference%"
			}
		case "containsNot":
			if (typeof(value) === "string" && value.indexOf(reference) === -1)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "string not containing %reference%"
			}
		case "beginsNot":
			if (typeof(value) === "string" && value.indexOf(reference) !== 0)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "string not beginning with %reference%"
			}
		case "endsNot":
			if (typeof(value) === "string" && value.slice(-reference.length) !== reference)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "string not ending with %reference%"
			}
		case "matchesNot":
			if (!(reference instanceof RegExp))
				reference = new RegExp(reference);
			if (typeof(value) === "string" && value.match(reference) === null)
				return { result: true }
			return {
				result: false,
				actual: value,
				details: "string not matching %reference%"
			}
		case "length":
			if (typeof(value) !== "string" && !(value instanceof Array))
				return {
					result: false,
					actual: "<n/a>",
					details: "string or array"
				}
			let res = evaluateValueCondition(value.length, reference);
			if (res.result === true)
				return { result: true }
			return {
				result: false,
				what: res.what,
				reference: res.reference,
				actual: value.length,
				details: "length " + res.details
			}
		case "each":
			if (!(value instanceof Array))
				return {
					result: false,
					actual: "<n/a>",
					details: "array"
				}
			for (let i=0; i<value.length; i++) {
				let res = evaluateValueCondition(value[i], reference);
				if (res.result === false)
					return {
						result: false,
						what: res.what,
						reference: res.reference,
						actual: value[i],
						index: i,
						details: res.details
					}
			}
			return { result: true }
	}
};

/*
 * Evaluate if a value validates a condition
 * - `value`: any type, value to check
 * - `condition`: object, condition object or array of condition objects
 * Returns an object:
 * - `result`: boolean, `true` if condition is validated
 * - `what`: string, name of the failing condition
 * - `reference`: any type, in case condition is not satisfied, the reference value
 *   for multiple conditions, this will be an object with a key for each condition
 * - `actual`: any type, the actual value
 * - `details`: string, a short text describing the failure
 * This is a long paragraph text to test the wrap around function.
 * This is a long paragraph text to test the wrap around function.
 * This is a long paragraph text to test the wrap around function.
 * This is a long paragraph text to test the wrap around function.
 * This is a long paragraph text to test the wrap around function.
 * This is a long paragraph text to test the wrap around function.
 * This is a long paragraph text to test the wrap around function.
 * This is a long paragraph text to test the wrap around function.
 * - this bullet contains a long nested bullet
 *   - not this one
 *   - but this one, this needs to be wrapped around as well
 *     but this one, this needs to be wrapped around as well
 *     but this one, this needs to be wrapped around as well
 *     but this one, this needs to be wrapped around as well
 *     but this one, this needs to be wrapped around as well
 *     but this one, this needs to be wrapped around as well
 *     but this one, this needs to be wrapped around as well
 *     but this one, this needs to be wrapped around as well
 *     but this one, this needs to be wrapped around as well
 *     but this one, this needs to be wrapped around as well
 *   - however, this is fine
 */
const evaluateValueCondition = function (value, condition) {
	// if array, return true if any condition in the array validates successfully
	if (condition instanceof Array) {
		let reference = [];
		let details = [];
		let list = [];
		for (let i=0; i<condition.length; i++) {
			let res = evaluateValueCondition(value, condition[i]);
			if (res.result === true)
				return { result: true }
			reference.push(res.reference);
			details.push(res.details.replace("%reference%", joinList(condition[i])));
			list.push(res);
		}
		return {
			result: false,
			what: "compound",
			reference: referenceList(list),
			actual: value,
			details: joinList(details, { stringify: false })
		}
	}

	// otherwise, if not an object treat it as shorthand for equality condition
	if (typeof(condition) !== "object") {
		let res = evaluateSingle("eq", value, condition);
		if (res.result === true)
			return { result: true }
		return {
			result: false,
			what: "eq",
			reference: condition,
			actual: res.actual,
			details: res.details.replace("%reference%", joinList(condition))
		}
	}

	// for each key, evaluate the condition and return a failing result if any fails
	for (let i in condition) {
		let res = evaluateSingle(i, value, condition[i]);
		if (!res.result) {
			let reference = res.reference ? res.reference : condition[i];
			let ret = {
				result: false,
				what: i + (res.what ? "/" + res.what : ""),
				reference: reference,
				actual: res.actual,
				details: res.details.replace("%reference%", joinList(reference))
			}
			if (res.index !== undefined)
				ret.index = res.index;
			return ret;
		}
	}
	return { result: true }
};

module.exports.evaluateValueCondition = evaluateValueCondition;
