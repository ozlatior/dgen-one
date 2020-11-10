/*
 * CodeUnit class
 *
 * A code tree describes the relationships between code units
 *
 * Anything "above" (previous) is included (required) by a module
 * Anything "below" (next) uses a module
 */

const CodeUnit = require("./codeunit.js");
const util = require("./util.js");

class CodeTree {

	constructor (basepath) {
		this.basepath = basepath !== undefined ? basepath : ".";
		// stores all units
		this.units = [];
		// stores units by path, like a dictionary
		this.paths = {};
		// stores the main entry point for this code tree
		this.main = null;
	}

	linkUnit (unit, main) {
		let path = util.joinPaths(this.basepath, unit.getPath());
		let base, imported;

		// any already linked units using this unit?
		for (let i in this.paths) {
			base = i.split("/").slice(0, -1).join("/");
			imported = this.paths[i].getImportedObjects();
			for (let j=0; j<imported.length; j++) {
				let fullPath = util.joinPaths(base, imported[j].path);
				if (fullPath === path) {
					this.paths[i].linkPrev(unit);
					unit.linkNext(this.paths[i]);
				}
			}
		}

		// does this unit use any already linked units?
		base = path.split("/").slice(0, -1).join("/");
		imported = unit.getImportedObjects();
		for (let i=0; i<imported.length; i++) {
			let fullPath = util.joinPaths(base, imported[i].path);
			if (this.paths[fullPath] !== undefined) {
				this.paths[fullPath].linkNext(unit);
				unit.linkPrev(this.paths[fullPath]);
			}
		}

		this.units.push(unit);
		this.paths[path] = unit;

		if (main)
			this.main = unit;
	}

	findRoots () {
		let ret = [];
		let allNodes = [];
		while (allNodes.length < this.units.length) {
			let i = 0;
			while (allNodes.indexOf(this.units[i]) !== -1)
				i++;
			let roots = this.units[i].getLast();
			ret = util.concatUnique(ret, roots);
			allNodes = util.concatUnique(allNodes, roots);
			for (i=0; i<roots.length; i++) {
				let upstream = roots[i].getAllPrev();
				allNodes = util.concatUnique(allNodes, upstream);
			}
		}
		return ret;
	}

}

module.exports = CodeTree;
