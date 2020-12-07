==============
class CodeTree
==============

**Base class:** Object

CodeTree class

A code tree describes the relationships between code units

CodeUnit objects provide the possibility to link directionally to any number of CodeUnit objects, hence forming a
non-binary tree. This class provides a method for performing the linking of units together as well as a method for
finding the roots of the resulting tree. After the roots are know, running through the tree is possible using the
methods provided by the CodeUnit class and derived classes.

The CodeTree creates the linking automatically by looking at the units required by each member of the tree.

Identical units are identified by their path (used by require statements).

Anything "above" (previous) is included (required) by the module

Anything "below" (next) uses the module


Constructor (basepath)
======================

Create a new CodeTree object based on a basepath

* `basepath`: string, all code unit paths will be relative to this path


Member methods
==============

This class defines the following member methods


CodeTree.prototype.linkUnit (unit, main)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Link (add) a new unit to this CodeTree

* `unit`: CodeUnit object, unit to link
* `main`: boolean, if this is true mark this as the main entry point for this tree

This method looks at the units already in the tree and creates any new links between them and the newly added CodeUnit
based on the modules included by each unit via the `require()` calls in the units' code.


CodeTree.prototype.findRoots ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Find the roots of the CodeTree.

Any element that is not required by anything else is considered to be a root. These roots can be used as entry points to
the tree.

Returns: array of CodeUnit, the list of roots for this tree