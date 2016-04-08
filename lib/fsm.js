var _ = require('lodash')
var lexer = require('./lexer.js')
var parser = require('./parser.js')

module.exports = {

  accessible: function(fsm, state) { return [] },


  isFsm: function (fsm) { return false },

  fromRegexp: function (regexp) { return this.fromRegex(regexp) },
  fromRegex: function(regex) {
    // get the regex
    regex = _.isString(regex) ? new RegExp(regex) : regex
    if (! (regex && _.isRegExp(regex))) {
      return
    }

    // get the string representation
    var pattern = regex.toString().replace(/\/(.*)\/[A-Za-z]*/, "$1")

    // tokenize
    var lexer = new lexer.Lexer(pattern)
    var tokens = lexer.tokenize()

    // parse
    var parser = new parser.Parse(tokens)
    var fsm = parser.build()

    // create the fsm

    // return the fsm

    return {
      pattern: pattern,
      tokens: tokens
    }
  }

}
