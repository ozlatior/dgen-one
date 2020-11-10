/*
 * Message Processing functions
 *
 * General message syntax
 *
 * Messages are strings spiced with variables, macros and conditional expressions
 *
 * Variables are read from the "tokens" object and are specified in the message string by
 * percent signs, such as `%myvar%`, which would replace `%myvar%` with the value of
 * `tokens.myvar`
 *
 * Macros are defined by the library:
 * - `%_TYPE_%`: `typeof value`
 * - `%_LEN_%`: `value.length`
 * - '%_ACTUAL_%`: 'stringified' version of the `actual` field
 * - '%_VALUE_%`: 'stringified' version of the `value` field
 *
 * Conditional expressions are parts of the string surrounded by `(?...?)` tokens
 * They begin with a condition which can either be the name of a token, which translates
 * to `<token> !== undefined`, or an binary operator expression such as `<token> === <value>`
 * Conditional expressions can be nested
 */

/*
 * Used to extract conditions from error message syntax
 */
const CONDITION_REGEXP = /^[^ ]+( *(===|==|!==|!=|>=|>|<=|<) *(('[^']*')|([^ ]+)))? +/g;

/*
 * Parse condition string such as `type === "number"`
 * Returns an object containing the operator and the operands
 * In case no operator is identified, the condition will be treated as `!== undefined`
 * Condition fields:
 * - `operator`: string, one of `===`, `==`, `!==`, `!=`, `>=`, `>`, `<=`, `<`, `boolean`
 * - `lho`: string, the name of the field that will be evaluated
 * - `rho`: any type, the value expected for `lho`
 */
const parseCondition = function(con) {
	let operator = con.match(/(===|==|!==|!=|>=|>|<=|<)/g);
	if (operator === null)
		return {
			operator: "boolean",
			lho: con.trim()
		}
	operator = operator[0];
	con = con.split(operator);
	return {
		operator: operator,
		lho: con[0].trim(),
		rho: JSON.parse(con[1].trim().replace(/"/g, "\\\"").replace(/'/g, "\""))
	}
};

/*
 * Evaluate a parsed condition object using user values
 * The field name will be looked up in the `values` object
 * Condition fields:
 * - `operator`: string, one of `===`, `==`, `!==`, `!=`, `>=`, `>`, `<=`, `<`, `boolean`
 * - `lho`: string, the name of the field that will be evaluated
 * - `rho`: any type, the value expected for `lho`
 */
const evaluateCondition = function(con, values) {
	switch (con.operator) {
		case "boolean":
			if (values[con.lho] !== undefined)
				return true;
			return false;
		case "===":
			if (values[con.lho] === con.rho)
				return true;
			return false;
		case "==":
			if (values[con.lho] == con.rho)
				return true;
			return false;
		case "!==":
			if (values[con.lho] !== con.rho)
				return true;
			return false;
		case "!=":
			if (values[con.lho] != con.rho)
				return true;
			return false;
		case ">=":
			if (values[con.lho] >= con.rho)
				return true;
			return false;
		case ">":
			if (values[con.lho] > con.rho)
				return true;
			return false;
		case "<=":
			if (values[con.lho] <= con.rho)
				return true;
			return false;
		case "<":
			if (values[con.lho] < con.rho)
				return true;
			return false;
	}
	return false;
};

/*
 * Evaluate a macro based on name and tokens object (should contain `value` field)
 */
const runMacro = function(macro, tokens) {
	switch (macro) {
		case "_ACTUAL_":
			if (tokens.actual === undefined)
				return "<undefined>";
			return JSON.stringify(tokens.actual);
		case "_LEN_":
			return tokens.value.length;
		case "_TYPE_":
			return typeof(tokens.value);
		case "_VALUE_":
			if (tokens.value === undefined)
				return "<undefined>";
			return JSON.stringify(tokens.value);
	}
};

/*
 * Extract sub expressions (conditionals) from message
 * Returns an object where the keys are the extracted conditionals and the values are the
 * parsed properties:
 * - `con`: object, condition object
 * - `msg`: message to replace conditional with if condition is fulfilled
 */
const extractSubs = function(message) {
	let l = 0;
	let r = 0;
	let ret = {};

	while (true) {
		l = message.indexOf("(?", r+1);
		if (l === -1)
			break;
		let c = 1;
		r = l + 1;
		while (r < message.length) {
			if (message.slice(r, r+2) === "?)")
				c--;
			if (message.slice(r, r+2) === "(?")
				c++;
			if (c === 0)
				break;
			r++;
		}
		if (r === message.length)
			break;
		let sub = message.slice(l, r+2);
		let msg = sub.slice(2, -2).trim();
		let con = msg.match(CONDITION_REGEXP);
		if (con === null)
			continue;
		con = con[0];
		ret[sub] = {
			con: parseCondition(con),
			msg: msg.slice(con.length-1)
		}
	}

	return ret;
};

/*
 * Entry function for message processing; replaces tokens in message with values in `tokens` object
 * and evaluates conditional substrings
 */
const replaceTokens = function(message, tokens) {
	// get a list of all conditional substrings and evaluate the conditions
	let subs = extractSubs(message);
	for (let i in subs) {
		// if condition is not fulfilled, replace with empty string, otherwise call this function
		// recursively on the substring and replace the result in the input string
		if (!evaluateCondition(subs[i].con, tokens))
			message = message.replace(i, "");
		else
			message = message.replace(i, replaceTokens(subs[i].msg, tokens));
	}

	// get a list of all tokens, if any
	let tok = message.match(/%[^%]+%/g);
	if (tok === null)
		return message;

	// replace the tokens in the list with values from the tokens object
	for (i=0; i<tok.length; i++) {
		let name = tok[i].slice(1, -1);
		let value;
		if (tokens[name] !== undefined)
			value = tokens[name];
		else
			value = runMacro(name, tokens);
		if (value !== undefined)
			message = message.replace(tok[i], value);
	}

	return message;
};

module.exports.parseCondition = parseCondition;
module.exports.evaluateCondition = evaluateCondition;
module.exports.runMacro = runMacro;
module.exports.extractSubs = extractSubs;
module.exports.replaceTokens = replaceTokens;
