/*
 * Main module entry point
 *
 * Exposes the Environment class to the user with all the other classes as fields
 */

const Environment = require("./src/environment.js");

const CodeTree = require("./src/codetree.js");
const CodeUnit = require("./src/codeunit.js");
const DirectiveEngine = require("./src/directive_engine.js");
const Generator = require("./src/generator.js");

const DEFAULT_SETTINGS = require("./src/default_settings.js");

const util = require("./src/util.js");

module.exports = Environment;

module.exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;

module.exports.CodeTree = CodeTree;
module.exports.CodeUnit = CodeUnit;
module.exports.DirectiveEngine = DirectiveEngine;
module.exports.Generator = Generator;

module.exports.util = util;
