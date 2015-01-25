var Firebase     = require('firebase')
var _            = require('lodash')    
var EventEmitter = require('events').EventEmitter

var firebase = function(args) {
    this.url     = args.firebase
    this.secret  = args['firebase-secret'] 
    this.root    = new Firebase(args.firebase)
    this.taskbox = args.taskbox
}
firebase.prototype = _.assign({

    connect : function() {
        this.root.authWithCustomToken(this.secret, function(err, auth) {
            if (err) throw err
            this.emit('ready')
        }.bind(this))
    },

    addToTaskBox : function(message) {
        console.log(this.taskbox, message.uid)
        this.root.child(this.taskbox).child(message.uid).set(message)
    },

}, EventEmitter.prototype)

module.exports = firebase
