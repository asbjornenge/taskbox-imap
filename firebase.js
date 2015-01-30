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

    reset : function() {
        this.root.child('taskbox').once('value', function(snap) {
            Object.keys(snap.val()).forEach(function(uid) {
                if (uid.indexOf(this.taskbox) == 0) this.root.child('taskbox').child(uid).remove()
            }.bind(this))
        }.bind(this))
    },

    addSequenceToTaskBox : function(messages) {
        Object.keys(messages).forEach(function(uid) {
            this.addToTaskBox(messages[uid])
        }.bind(this))
    },

    addToTaskBox : function(message) {
        console.log('Adding to firebase',message.uid)
        this.root.child('taskbox').child(this.taskbox+'_'+message.uid).set(message)
    },

    delFromTaskBox : function(uid) {
        console.log('Removing from firebase', uid)
        this.root.child('taskbox').child(this.taskbox+'_'+uid).remove()
    }

}, EventEmitter.prototype)

module.exports = firebase
