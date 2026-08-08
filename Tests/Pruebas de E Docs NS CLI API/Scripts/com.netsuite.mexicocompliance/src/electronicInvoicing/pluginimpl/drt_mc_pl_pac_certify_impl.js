/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 *@NApiVersion 2.x
 *@NScriptType plugintypeimpl
 *@NModuleScope Public
 */
define(['N/log', './../drt_sendToCertify'], function (log, sendToCertify) {
    /**

         * send - This function is the entry point of our plugin script

         * @param {Object} plugInContext

         * @param {String} plugInContext.scriptId

         * @param {String} plugInContext.sendMethodId

         * @param {String} plugInContext.eInvoiceContent

         * @param {Object} plugInContext.customer

         * @param {String} plugInContext.customer.id

         * @param {Array}  plugInContext.customer.recipients

         * @param {Object} plugInContext.transaction

         * @param {String} plugInContext.transaction.number

         * @param {String} plugInContext.transaction.id

         * @param {String} plugInContext.transaction.poNum

         * @param {Object} plugInContext.sender

         * @param {String} plugInContext.sender.id

         * @param {String} plugInContext.sender.name

         * @param {String} plugInContext.sender.email

         * @param {Array} plugInContext.attachmentFileIds

         *

         * @returns {Object} result

         * @returns {Boolean} result.success

         * @returns {String} result.message

         */

    function send(pluginContext) {
        log.audit({
            title: 'pluginContext',
            details: JSON.stringify(pluginContext)
        });
        return {
            eiStatus: sendToCertify.do(pluginContext, {}),
            message: '',
            success: true,
        };
    }

    return {
        send: send,
    };
});