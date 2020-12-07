=========================================
DGenOne Command Line Interface (./cli.js)
=========================================

**Nodejs executable script for documentation generation**

Execution:

::

  node path/to/cli.js command [ arguments ]

Available commands:

* `help [command]`: print a general help text or command help text if command is given
* `config init`: initialize a project configuration sequence in current directory
* `config default`: configure a project with default settings in current directory
* `config get <key>`: print the currently configured value(s) for key
* `config set <key> <value>`: set config value at key
* `document files`: generate file content documentation (code units)
* `document objects`: generate object content documentation (classes)

Generated at Mon Dec 07 2020 11:16:32 GMT+0800 (Central Indonesia Time)