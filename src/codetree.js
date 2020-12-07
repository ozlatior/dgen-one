/*
 * CodeTree class
 */

const CodeUnit = require("./codeunit.js");
const util = require("./util.js");

/*
 * CodeTree class
 *
 * A code tree describes the relationships between code units
 *
 * CodeUnit objects provide the possibility to link directionally to any
 * number of CodeUnit objects, hence forming a non-binary tree. This class
 * provides a method for performing the linking of units together as well as
 * a method for finding the roots of the resulting tree. After the roots are
 * know, running through the tree is possible using the methods provided by
 * the CodeUnit class and derived classes.
 *
 * The CodeTree creates the linking automatically by looking at the units
 * required by each member of the tree.
 *
 * Identical units are identified by their path (used by require statements).
 *
 * Anything "above" (previous) is included (required) by the module
 *
 * Anything "below" (next) uses the module
 */
class CodeTree {

	/*
	 * Create a new CodeTree object based on a basepath
	 * `basepath`: string, all code unit paths will be relative to this path
	 */
	constructor (basepath) {
		this.basepath = basepath !== undefined ? basepath : ".";
		// stores all units
		this.units = [];
		// stores units by path, like a dictionary
		this.paths = {};
		// stores the main entry point for this code tree
		this.main = null;
	}

	/*
	 * Link (add) a new unit to this CodeTree
	 * `unit`: CodeUnit object, unit to link
	 * `main`: boolean, if this is true mark this as the main entry point for this tree
	 *
	 * This method looks at the units already in the tree and creates any new links
	 * between them and the newly added CodeUnit based on the modules included by each unit
	 * via the `require()` calls in the units' code.
	 */
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

	/*
	 * Find the roots of the CodeTree.
	 *
	 * Any element that is not required by anything else is considered to be a root.
	 * These roots can be used as entry points to the tree.
	 *
	 * Returns: array of CodeUnit, the list of roots for this tree
	 */
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
