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
    messages        : {},
    totalNumMessage : 0
}

var updateMessagesStateAndAddToTaskBox = function(messages) {
    console.log(Object.keys(state.messages), Object.keys(messages))
    _.assign(state.messages,messages) 
    console.log(Object.keys(state.messages))
    firebase.addSequenceToTaskBox(messages)
}
var updateMessagesStateAndDelFromTaskBox = function(info) {
    var id = _.findKey(state.messages, { seqno : info.seqno })
    if (!id) return // <- sync?
    delete state.messages[id]
    firebase.delFromTaskBox(id)
}

firebase.on('ready', function() {
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
    imap.connect()
})
firebase.connect()
