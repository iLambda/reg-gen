// require all modules
var _ = require('lodash')
var lex = require('./lexer.js')

/*
* PARSER class
*/
function Parser(data) {
  if (_.isArray(data)) {
    this.tokens = data
  } else if (data instanceof lex.Lexer) {
    this.tokens = data.tokenize()
  } else {
    throw new Error("The given argument is not an array, nor a Lexer")
  }
}

Parser.prototype.build = function() {
  
}

module.exports.Parser = Parser
