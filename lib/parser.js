// require all modules
var _ = require('lodash')
var lex = require('./lexer.js')

/*
* PARSER class
*/
function Parser(data) {
  this.idx = 0
  if (_.isArray(data)) {
    this.tokens = data
  } else if (data instanceof lex.Lexer) {
    this.tokens = data.tokenize()
  } else {
    throw new Error("The given argument is not an array, nor a Lexer")
  }
}

Parser.prototype.reset = function() {
  // reset index
  this.idx = 0
}

Parser.prototype.hasNext = function() {
  // return true if a char is available
  if (this.tokens) {
    return this.idx < this.tokens.length
  } else {
    return false
  }
}

Parser.prototype.next = function() {

}

Parser.prototype.build = function() {
  // reset
  this.reset()
}

module.exports.Parser = Parser
