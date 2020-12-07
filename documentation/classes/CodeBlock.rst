===============
class CodeBlock
===============

**Base class:** Object

CodeBlock class

A code block is a functional piece of code, eg a comment block, a function or a class declaration

Blocks are linked like a list, but on three different levels:

* level 0: any block before or after, regardless of proximity
* level 1: any immediately adjacent block, regardless of type
* level 2: any block before or after, up to the first comment block that is not level1-linked

For example:

1: <comment block> (section header 1)

2: <comment block> (function documentation) 3: <function block>

4: <comment block> (class documentation) 5: <class block>

6: <comment block> (section header 2)

7: <comment block> (variable documentation) 8: <variable block> 9: <variable block> 10: <variable block> 11: <variable
block>

Links at level 0: all blocks (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11) Links at level 1: groups (1), (2, 3), (4, 5), (6), (7,
8, 9, 10, 11) Links at level 2: groups (1, 2, 3, 4, 5), (6, 7, 8, 9, 10, 11)

To link two blocks, use: block.setPrev(level, prevBlock); block.setNext(level, nextBlock);

To access a linked block, use: Use the optional `of` argument to select only blocks of specific type
block.getPrev(level, of); block.getNext(level, of);

To get the first (head) or last (tail) linked block, use: block.getHead(level); block.getTail(level);

To get all blocks before or after, use: Use the optional `of` argument to select only blocks of specific type
block.getAllPrev(level, of); block.getAllNext(level, of);

To get the full list, use: Use the optional `of` argument to select only blocks of specific type block.getList(level,
of);


Constructor (content, row)
==========================

Create new content block based on string content

* `content`: either of the following
   * string, the content to read into this content block
   * CodeBlock object, use this as a copy constructor
* `row`: number, optional, starting row for the content (not used in copy-constructor mode) default value is 0

If more than one block is present in the content, only the first block will be processed into this CodeBlock object


Member methods
==============

This class defines the following member methods


CodeBlock.prototype.getClassName ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get class (constructor) name for this object

Returns string, the class name, eg `CodeBlock` or `CommentBlock`


CodeBlock.prototype.getType ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get the string type for this CodeBlock instance.

Returns string, one of `commentLine`, `commentBlock`, `requireModule`, `funDeclaration`, `varDeclaration`,
`classDeclaration`, `methodDeclaration`, `assignment` or `unknown`


CodeBlock.prototype.getStartingRow ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get the starting row for this CodeBlock

Returns number, the starting row passed as argument to the constructor


CodeBlock.prototype.getRowCount ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get the total row count for this CodeBlock

Returns number, the total number of rows for this codeblock


CodeBlock.prototype.getContent ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get the original content parsed by this CodeBlock

Returns string, the content used to create this CodeBlock - only the content actually part of the codeblock will be
returned, not the entire string passed to the constructor


CodeBlock.prototype.getContentLength ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get the original content length parsed by this CodeBlock

Returns number, the length of the content used to create this CodeBlock - only the content actually part of the
codeblock will be considered, not the entire string passed to the constructor


CodeBlock.prototype.getRowsBefore ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get the number of empty rows before this CodeBlock

Returns number, the number of empty rows before the content of this CodeBlock


CodeBlock.prototype.setRowsBefore (rows)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Set the number of empty rows before this CodeBlock

* `rows`: number, the number of empty rows before the content parsed by this CodeBlock


CodeBlock.prototype.getRowsAfter ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get the number of empty rows after this CodeBlock

Returns number, the number of empty rows after the content of this CodeBlock


CodeBlock.prototype.setRowsAfter (rows)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Set the number of empty rows after this CodeBlock

* `rows`: number, the number of empty rows after the content parsed by this CodeBlock


CodeBlock.prototype.getExportedName ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get the exported (identifier) name for this CodeBlock

Returns string, the exported (identifier) name, for instance the class name or variable name.


CodeBlock.prototype.setExportedName (name)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Set the exported (identifier) name for this CodeBlock

* `name`: string, the exported (identifier) name, for instance the class name or variable name.


CodeBlock.prototype.getAliases ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get a copy of the aliases list for this CodeBlock

Returns: array of strings, copy of the aliases list


CodeBlock.prototype.setAliases (aliases)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Set the aliases list to a new set of values provided in the array

* `aliases`: array of strings, the new values for the aliases list


CodeBlock.prototype.addAlias (alias)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Add a new alias to the aliases list

* `alias`: string, new alias to add to the list

Returns: boolean, true if successful, false if not (alias already in the list)


CodeBlock.prototype.clearAliases ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Remove all aliases from the aliases list


CodeBlock.prototype.getAliasCount ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get the number of aliases in the list

Returns: number, the size of the aliases list


CodeBlock.prototype.assignField (field, value)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Assign a value to an object field for this CodeBlock

* `field`: string, name of the field
* `value`: any type, value to assign - can be any value or a CodeBlock reference

Fields are exported in the documentation, so assigned fields are one way to specify that an object contains a value or a
reference to another object defined by a CodeBlock


CodeBlock.prototype.getAssignedFields ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get a reference to the assigned fields of this CodeBlock

Returns: object, reference to the internal assigned fields object.


CodeBlock.prototype.getAssignedFieldNames ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get a list of assigned field names for this CodeBlock

Returns: array of strings, list of assigned fields


CodeBlock.prototype.getParent ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeBlock.prototype.setParent (_parent)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `_parent`


CodeBlock.prototype.setPrev (level, block)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `level`

* `block`


CodeBlock.prototype.setNext (level, block)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `level`

* `block`


CodeBlock.prototype.getPrev (level, of)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `level`

* `of`


CodeBlock.prototype.getNext (level, of)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `level`

* `of`


CodeBlock.prototype.getHead (level)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `level`


CodeBlock.prototype.getTail (level)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `level`


CodeBlock.prototype.getAllPrev (level, of)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `level`

* `of`


CodeBlock.prototype.getAllNext (level, of)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `level`

* `of`


CodeBlock.prototype.getList (level, of)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `level`

* `of`


CodeBlock.prototype.buildMeta ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeBlock.prototype.toSpecificInstance ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CodeBlock.prototype.toString ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments