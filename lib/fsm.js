module.exports = {

  accessible: function(fsm, state) { return [] }
  

  isFsm: function (fsm) { return false }

  fromRegexp: function (regexp) { return this.fromRegex(regexp) }
  fromRegex: function(regex) {
    // iterate over the regex
    // create the fsm
    // return the fsm
    return {}
  }

}
