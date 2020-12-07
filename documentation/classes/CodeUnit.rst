==============
class CodeUnit
==============

**Base class:** Object

CodeUnit class

A code unit is basically a file containing code

Code units can be linked in a tree structure by adding CodeUnit references to the link.prev and link.next arrays Use the
`linkNext()` and `linkPrev()` method for this purpose


Constructor (content, row, path, name, description)
===================================================

**Arguments**

* `content`

* `row`

* `path`

* `name`

* `description`


Member methods
==============

This class defines the following member methods


CodeUnit.prototype.loadCode (content, row)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `content`

* `row`


CodeUnit.prototype.buildMeta ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getBlocks ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getBlocksByType (type)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `type`


CodeUnit.prototype.getBlocksByInstance (instance)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `instance`


CodeUnit.prototype.getBlockByPath (path)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `path`


CodeUnit.prototype.getFirstBlock ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getBlockAt (i)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `i`


CodeUnit.prototype.getBlockIndex (block)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `block`


CodeUnit.prototype.linkPrev (unit)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `unit`


CodeUnit.prototype.linkNext (unit)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `unit`


CodeUnit.prototype.getPrev ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getNext ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getAllPrev ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getAllNext ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getFirst ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getLast ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getName ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getDescription ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getPath ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getContentBlock ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getContentLength ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getImportedObjects ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getExportedObjects ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.getExportedName ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeUnit.prototype.setExportedName (name)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `name`


CodeUnit.prototype.getMeta (field)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `field`


CodeUnit.prototype.setMeta (field, value)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `field`

* `value`


CodeUnit.prototype.toString ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments