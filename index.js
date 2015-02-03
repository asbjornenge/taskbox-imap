#!/usr/bin/env node
var args = require('minimist')(process.argv.slice(2), {
    default : {
        user     : process.env['IMAP_USER'],
        password : process.env['IMAP_PASSWORD'],
        host     : process.env['IMAP_HOST'],
        port     : process.env['IMAP_PORT'],
        tls      : process.env['IMAP_TLS']
    }
})
args.taskbox = require('js-md5')(args.user)
var _        = require('lodash')

var Imap     = require('./imap')
var imap     = new Imap(args)
var Firebase = require('./firebase')
var firebase = new Firebase(args)

console.log(args)
var state = {
    messages         : {},
    totalNumMessages : 0
}

// TODO: Move these to utils ? <- YES!
// TODO: BUG: Fails if mailbox empty - tries to fetch sequence 1:0
var updateMessagesStateAndAddToTaskBox = function(messages) {
    _.assign(state.messages,messages)
    state.totalNumMessages = Object.keys(state.messages).length 
    firebase.addSequenceToTaskBox(messages)
}
var updateMessagesStateAndDelFromTaskBox = function(info) {
    var id = _.findKey(state.messages, { seqno : info.seqno })
    console.log('Removing id',id)
    if (!id) return // <- sync?
    Object.keys(state.messages).forEach(function(uid) {
        var msg = state.messages[uid]
        if (msg.seqno > info.seqno) msg.seqno -= 1
    })
    delete state.messages[id]
    state.totalNumMessages = Object.keys(state.messages).length
    firebase.delFromTaskBox(id)
}

firebase.on('ready', function() {
    console.log('firebase ready')
    firebase.reset() // <- Start with a blank slate - ONLY FOR TESTING! Implement proper sync later
    imap.on('ready', function() {
        imap.once('mailbox-open', function(box) {
            state.totalNumMessages = box.messages.total
            imap.fetchSequence(1,box.messages.total, updateMessagesStateAndAddToTaskBox)
                imap.on('mail-added', function(info) {
                    imap.fetchSequence(state.totalNumMessages+1, state.totalNumMessages+info.numNewMessages, updateMessagesStateAndAddToTaskBox)
                })
                imap.on('mail-removed', function(info) {
                    updateMessagesStateAndDelFromTaskBox(info)
                })
                imap.startMailBoxStream(box.name)
        })
        imap.openMailBox('INBOX')
    })
    setTimeout(function() {
        imap.connect()
    },1000)
})
firebase.connect()
