// require all modules
var _ = require('lodash')

/*
* TOKEN class
*/
function Token(type, data) {
  this.type = type
  this.data = data
}

Token.prototype.functionality = function() {
  switch (this.type) {
    case Token.kind.dot:
    case Token.kind.blank:
    case Token.kind.class:
    case Token.kind.char:
    case Token.kind.charset:
    case Token.kind.empty:
      return 'char'

    case Token.kind.or:
    case Token.kind.concat:
      return 'operator'

    case Token.kind.star:
    case Token.kind.plus:
    case Token.kind.alter:
    case Token.kind.times:
      return 'postoperator'

    case Token.kind.lbracket:
      return 'lbracket'
    case Token.kind.rbracket:
      return 'rbracket'

    default:
      return undefined

  }
}

Token.kind = {
  or: { symbol: '|', precedence: 1, leftAssociative: true },

  concat: { symbol: '@', precedence: 2, leftAssociative: true },

  dot: { symbol: '.' },
  blank: { symbol: ' ' },
  class: { symbol: '\d\D\w\W' },
  char: { symbol: 'a-z0-9_ \n\t\r' },
  charset: { symbol: '[xyz]' },

  star: { symbol: '*', precedence: 3, leftAssociative: false },
  plus: { symbol: '+', precedence: 3, leftAssociative: false },
  alter: { symbol: '?', precedence: 3, leftAssociative: false },
  times: { symbol: '{n,m}', precedence: 3, leftAssociative: false },

  lbracket: { symbol: '(', precedence: 4 },
  rbracket: { symbol: ')', precedence: 4 },

  end: { symbol: 'END', precedence: Infinity  },
  empty: { symbol: 'ε', precedence: Infinity }
}

/*
 * LEXER class
 */
function Lexer(pattern) {
  // save pattern data
  this.pattern = pattern
  this.idx = 0
}

Lexer.prototype.reset = function() {
  // reset index
  this.idx = 0
}

Lexer.prototype.isChar = function(data) {
  // true if data is a regex char or a space
  return _.isString(data) && data.search(/\w| /) >= 0
}

Lexer.prototype.hasNext = function() {
  // return true if a char is available
  if (this.pattern) {
    return this.idx < this.pattern.length
  } else {
    return false
  }
}

Lexer.prototype.consume = function() {
  // return a char
  if (this.hasNext()) {
    var c = this.pattern[this.idx++]
    return c
  } else {
    return null
  }
}

Lexer.prototype.remember = function() {
  // return a char
  if (this.idx > 0) {
    return this.pattern[this.idx - 1]
  } else {
    return null
  }
}

Lexer.prototype.peek = function() {
  // return a char
  if (this.hasNext()) {
    return this.pattern[this.idx + 1]
  } else {
    return null
  }
}

Lexer.prototype.next = function() {
  // the token data
  var data = "", char
  // while a char is available
  while (this.hasNext()) {
    switch (char = this.consume()) {
      // adding brackets
      case '(':
        return new Token(Token.kind.lbracket, '(')
      case ')':
        return new Token(Token.kind.rbracket, ')')

      // character class
      case '[':
        var charset = []
        // while we encounter an ending square bracket
        while ((char = this.consume()) !== ']') {
          // get the last valid character
          var lastChar = _.last(charset)
          // if we're on a regexp char..
          if (this.isChar(char)) {
            if (this.isChar(lastChar)) {
              // .. and the last valid character is also a regexp char
              // then this character is valid
              charset.push(char)
            } else if (lastChar === '-' && char >= charset[charset.length - 2]) {
              // .. and the last valid character is a caret, plus the
              //    current character is bigger than the one we started with
              // then this character is valid
              charset.push(char)
            } else {
              // error
              throw new Error('Error while parsing character class ' + charset.join(''))
            }
          } else if (char === '-' && this.isChar(lastChar)) {
            // add a caret
            charset.push('-')
          } else {
            // error
            throw new Error('Error while parsing character class ' + charset.join(''))
          }
        }
        // return the token
        return new Token(Token.kind.charset, charset)

      // start and end tokens
      case '^':
      case '$':
        continue

      // postfix operators
      case '*':
        return new Token(Token.kind.star, '*')
      case '+':
        return new Token(Token.kind.plus, '+')
      case '?':
        var peek = this.peek()
        var remembered = this.remember()

        // check for a special character
        if (peek === ':') {
          // non capturing group token.
          if (remembered === '(') {
            // just after a parenthesis : ignore it
            continue
          } else {
            throw new Error('Non-matching parenthesis token not in brackets. "\\".')
          }
        } else if (peek === '=') {
          throw new Error('"if followed by" is not a supported token yet. "\\".')
        } else if (peek === '!') {
          throw new Error('"if not followed by" is not a supported token yet. "\\".')
        } else {
          return new Token(Token.kind.alter, '?')
        }

      case '|':
        return new Token(Token.kind.or, '|')
      case '{':
        var data = [0]
        // while we encounter an ending square bracket
        while ((char = this.consume()) !== '}') {
          // current number idx
          var currentIdx = data.length - 1
          // check current character
          if (char.search(/[0-9]/)) {
            // add the digit
            data[currentIdx] = data[currentIdx] * 10 + (~~char)
          } else if (char === ',') {
            // add a new value
            data.push(0)
          } else {
            // the token will be invalid, in hope to exactly matching RegExp behavior.
            //    For instance, /a{1, 2}/; /a{1,e}/; /a{1,4,5}/ are all valid RegExp
            //    but match no string.
            data = []
            break
          }
        }
        // return the token
        return new Token(Token.kind.times, data.length <= 2 ? data : [])

      case '.':
        return new Token(Token.kind.dot, '.')
      case ' ':
        return new Token(Token.kind.blank, ' ')
      case '\\':
        switch (this.consume()) {
          case 'n':
            return new Token(Token.kind.char, '\n')
          case 't':
            return new Token(Token.kind.char, '\t')
          case 'r':
            return new Token(Token.kind.char, '\r')
          case '\\':
            return new Token(Token.kind.char, '\\')
          case 'd':
            return new Token(Token.kind.class, '\d')
          case 'w':
            return new Token(Token.kind.class, '\w')
          case 'D':
            return new Token(Token.kind.class, '\D')
          case 'W':
            return new Token(Token.kind.class, '\W')
        }
        throw new Error('Expected valid character after "\\".')

      default:
        if (this.isChar(char)) {
          return new Token(Token.kind.char, char)
        } else {
          throw new Error('Unrecognized token : "' + char + '"')
        }
    }
  }
}

Lexer.prototype.isImplicitConcat = function(prev, actual) {
  // get token functionality
  var prevfunc = prev ? prev.functionality() : undefined
  var actualfunc = actual.functionality()

  // return true if a concat symbol is implicit btwn prev and actual
  return prev &&
           (actualfunc === 'lbracket' ||
             (actualfunc === 'char' && _.includes(['char', 'rbracket', 'postoperator'], prevfunc)))
}

Lexer.prototype.tokenize = function() {
  // reset
  this.reset()
  // tokens list
  var tokens = []
  var char = ''
  // while we can parse
  while (this.hasNext()) {
    // get last token and the fresh one
    var prev = _.last(tokens)
    var token = this.next()
    // add a concat op ?
    if (this.isImplicitConcat(prev, token)) {
      tokens.push(new Token(Token.kind.concat, '@'))
    }
    // add fresh token to list
    tokens.push(token)
  }
  // return tokens
  return tokens
}

Lexer.prototype.postfix = function(tokens) {
  // if tokens are empty
  if (!tokens || !_.isArray(tokens) || tokens.length == 0) {
    return
  }
  // create temp
  var output = [], stack = []

  // while there are tokens to be read
  while (tokens.length > 0) {
    // get the token
    var token = tokens.shift()
    // act depending on the token's functionality
    switch (token.functionality()) {
      case 'char':
        // add to the output queue
        output.push(token)
        // end
        continue

      case 'operator':
        // test for operator precedence
        while (stack.length > 0 && stack[stack.length - 1].functionality() === 'operator'
               && ((token.type.leftAssociative && token.type.precedence <= stack[stack.length - 1].type.precedence)
                  || (!token.type.leftAssociative && token.type.precedence < stack[stack.length - 1].type.precedence)) ) {
          // pop operators off the stack to the output
          output.push(stack.pop())
        }
        // push operator
        stack.push(token)
        continue

      case 'postoperator':
        // push to output
        output.push(token)
        continue

      case 'lbracket':
        // push to stack
        stack.push(token)
        // end
        continue

      case 'rbracket':
        // until the token at the top is a left parenthesis
        while (stack.length > 0 && stack[stack.length - 1].functionality() !== 'lbracket') {
          // pop operators off the stack to the output
          output.push(stack.pop())
        }
        // if stack is empty, something was wrong
        if (stack.length == 0) {
          // error
          throw new Error('Mismatched parenthesis in pattern')
        }
        // remove the parenthesis
        stack.pop()
        // end
        continue

      default:
        // undefined token
        throw new Error('The token was not recognized')
    }
  }

  // if still operator tokens
  while (stack.length > 0) {
    if (stack[stack.length - 1].functionality().search(/bracket/) >= 0){
      throw new Error('Mismatched parenthesis in pattern')
    }
    // push in output
    output.push(stack.pop())
  }
  // return postfix token list
  return output
}


module.exports.Lexer = Lexer
module.exports.Token = Token
