/**

 *    Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.

 */

/**

 * @NApiVersion 2.x

 * @NScriptType plugintypeimpl

 * @NModuleScope Public

 */

define(["N/render"], function (nsrender) {

  /**

   * inject - This function will provide the custom data source during the generation process

   * @param {Object} params

   * @param {String} params.transactionId

   * @param {Object} params.transactionRecord

   * @param {Object} params.transactionResponseRecId (only present if this data source is being used to create transaction response's response body)



   *

   * @returns {Object} result

   * @returns {render.DataSource} result.alias

   * @returns {string} result.format

   * @returns {Object | Document | string} result.data

   * @returns {Object} result.result (optional)

   * @returns {Boolean} result.result.success (optional)

   * @returns {string} result.result.eiAuditTrailMsg (optional)

   */

  function inject(params) {


    var customObj = {};

    log.debug("Custom Object", customObj);

    try {
      return {

        customDataSources: [
          {
            format: nsrender.DataSource.OBJECT,
            alias: "custom",
            data: customObj
          }
        ],
        result: {
          success: true,
          eiAuditTrailMsg: "Custom Data Source executed successfully"
        }

      };
    } catch (exp) {
      return {
        result:
        {
          success: false,
          eiAuditTrailMsg: exp.name + ':  ' + exp.message,
        },
      };

    }
  }



  return {

    inject: inject

  };

});