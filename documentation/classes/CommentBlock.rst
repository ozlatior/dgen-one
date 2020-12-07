==================
class CommentBlock
==================

**Base class:** CodeBlock


Constructor (codeblock)
=======================

**Arguments**

* `codeblock`


Member methods
==============

This class defines the following member methods


CommentBlock.prototype.hasDirectives ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CommentBlock.prototype.getDirectives ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CommentBlock.prototype.getDirectivesByVerb (verb)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `verb`


CommentBlock.prototype.getText ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CommentBlock.prototype.getTrimmedText ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CommentBlock.prototype.getCompactText ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CommentBlock.prototype.getTrimmedRowCount ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments


CommentBlock.prototype.extractRowBullet (row)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For bulleted rows, extract what looks like the bullet, eg ` * ` or ` - `

Accepted bullets: \*, -, +, >, ->, =>, #

Treats as bullets any row starting with [ `...`: ] (returns [ \``: ])

Bullets must be followed by space

Returns `null` if no bullet or the bullet string if a bullet was found


CommentBlock.prototype.extractSectionBullet (section)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A section is a bullet section if it ends with one or more identical bullet lines


CommentBlock.prototype.getSections ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Section fields:

* `text`: string, the paragraph text (without bullet text)
* `bullet`: string, bullet for this section
* `bulletText`: array of sections, the text contained in the bullets (allows for nested bullets)
* `indent`: string, indentation for this section
* `startingRow`: number, starting row for this section
* `rowCount`: number, row count for this section
* `rowsBefore`: number, empty rows before this section
* `rowsAfter`: number, empty rows after this section


CommentBlock.prototype.toString ()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

This method does not take any arguments