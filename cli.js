/*
 * DGenOne Command Line Interface
 *
 * Nodejs executable script for documentation generation
 *
 * Execution:
 *
 * :: node path/to/cli.js command [ arguments ]
 *
 * Available commands:
 * `help [command]`: print a general help text or command help text if command is given
 * `config init`: initialize a project configuration sequence in current directory
 * `config default`: configure a project with default settings in current directory
 * `config get <key>`: print the currently configured value(s) for key
 * `config set <key> <value>`: set config value at key
 * `document files`: generate file content documentation (code units)
 * `document objects`: generate object content documentation (classes)
 *
 */

const fs = require("fs");
const path = require("path");

const util = require("./src/util.js");

const Environment = require("./index.js");

// @stop

const cwd = process.cwd();

const help = util.parseSectionFile(fs.readFileSync(path.join(__dirname, "./cli-help")).toString());

const commands = {

	_: function () {
		let output = help.__unknown__.slice(0);
		return {
			output: util.indentBlock(output, "  "),
			status: -1
		}
	},

	config: function (cmd, key, value) {
		switch (cmd) {
			case "init":
				return {
					output: [
						"Not implemented"
					],
					status: -1
				}
			case "default":
				let content = fs.readFileSync(path.join(__dirname, "./src/default_settings.js")).toString();
				fs.writeFileSync("./dgen-one-settings.js", content);
				return {
					output: [
						"Default settings written to `./dgen-one-settings.js`",
						"You can edit this file by hand or run `config set` to set a key from command line"
					],
					status: 0
				}
			case "get":
				let config = require(path.join(cwd, "./dgen-one-settings.js"));
				let value = config;
				if (key)
					value = util.deepRead(config, key);
				if (value === undefined)
					return {
						output: [ "No such key in config file " + key ],
						status: -1
					}
				if (typeof(value) === "object") {
					if (value instanceof Array) {
						if (value.length <= 5)
							value = [ key + ": [ " + util.arrayElements(value, false) + " ]" ];
						else {
							value = util.indentBlock(util.arrayElements(value, true));
							value.unshift("[");
							value.unshift(key + ":");
							value.push("]");
						}
					}
					else {
						value = util.indentBlock(util.objectFields(value), "  ");
						value.unshift((key === undefined ? "config" : key) + ":");
					}
				}
				else
					value = [ key + ": " + JSON.stringify(value) ];
				return {
					output: value,
					status: 0
				}
			case "set":
				return {
					output: [
						"Not implemented"
					],
					status: -1
				}
		}
		if (cmd === undefined)
			return {
				output: [ "Config takes a second command argument. Use --help for a list of available options" ],
				status: -1
			};
		return {
			output: [ "Unknown command `config " + cmd + "`. Use --help for a list of available options" ],
			status: -1
		};
	},

	document: function (target) {
		let settings = null;

		try {
			settings = require(path.join(cwd, "./dgen-one-settings.js"));
		}
		catch (e) {
			return {
				output: [
					"Error reading config file: " + e.message,
					"Make sure to run `config init` or `config default` before running the generator"
				],
				status: -1
			}
		}

		let env = new Environment(settings);

		try {
			env.autoloadProjectFiles(cwd);
		}
		catch (e) {
			return {
				output: [
					e.message,
					"There were errors while reading the code and comments. Stopping."
				],
				status: -1
			}
		}

		let outputPath = path.join(cwd, settings.paths.outputPath);
		try {
			if (target === "files") {
				env.outputFilesDocumentation(outputPath);
			}
			else if (target === "objects") {
				env.outputObjectsDocumentation(outputPath);
			}
			else return {
				output: [ "Unknown documentation output target " + target + ", use `files` or `objects`" ],
				status: -1
			}
		}
		catch (e) {
			return {
				output: [
					e.message,
					"There were errors while writing the documentation."
				]
			}
		}

		return {
			output: [
				"RST documentation written to " + outputPath,
				"Use the Makefile to run sphinx for further conversion options."
			],
			status: 0
		}
	},

	help: function (cmd) {
		let output = help.__application__;
		if (cmd)
			output = help[cmd] === undefined ? help.__unknown__ : help[cmd];
		return {
			output: util.indentBlock(output, "  "),
			status: 0
		}
	}

}

const printAndExit = function(result) {
	console.log("\n" + result.output.join("\n") + "\n");
	process.exit(result.status);
}

let args = process.argv.slice(2);

let command = args.shift();

if (commands[command]) {
	if ((args.indexOf("-h") !== -1) || (args.indexOf("--help") !== -1))
		printAndExit(commands.help(command));
	printAndExit(commands[command].apply(null, args));
}

printAndExit(commands._());
