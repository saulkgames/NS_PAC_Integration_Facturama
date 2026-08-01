/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([], function () {
  "use strict";

  function LegacyTax(nsSearch, nsFormat, nsRecord) {
    this.nsSearch = nsSearch;
    this.nsFormat = nsFormat;
    this.nsRecord = nsRecord;
    this.satTaxCodeCache = {};
  }

  LegacyTax.prototype.addTaxes = function (customItem, txnRecord, line) {
    var customTaxes = customItem.taxes;
    var taxCode = txnRecord.getSublistValue({
      sublistId: "item",
      fieldId: "taxcode",
      line: line,
    });
    var taxItems = this._getLegacyChildTaxItemsIfGroup(taxCode);
    log.debug("Taxitems", taxItems);
    var taxAmount = txnRecord.getSublistValue({
      sublistId: "item",
      fieldId: "tax1amt",
      line: line,
    });

    var taxLineItems = customTaxes.taxItems;
    var taxLineItem;
    var that = this;
    taxItems.map(function (val) {
      taxLineItem = {};

      var taxRatePercent = that.nsFormat.parse({
        type: that.nsFormat.Type.PERCENT,
        value: val.rate ? val.rate : 0.0,
      });

      taxLineItem.taxType = val.taxtype ? val.taxtype[0].value : null;
      // eslint-disable-next-line no-magic-numbers
      taxLineItem.taxRate = taxRatePercent / 100.0;
      taxLineItem.taxBaseAmount = val.taxbasis
        ? customItem.amount * val.taxbasis / 100.0
        : customItem.amount;

      taxLineItem.taxCode = val.itemid;
      taxLineItem.satTaxCodeKey = "k" + val.itemid;
      taxLineItem.exempt = val.exempt;

      taxLineItems.push(taxLineItem);
    });
    customTaxes.taxName = "TRANSFERS";
    customTaxes.taxAmount = taxAmount;
    customItem.taxes = customTaxes;
  };

  LegacyTax.prototype._getLegacyChildTaxItemsIfGroup = function (taxCode) {
    if (this.satTaxCodeCache[taxCode]) {
      return this.satTaxCodeCache[taxCode];
    }
    var taxGroup;
    var taxCodeRecord = this.nsSearch.lookupFields({
      type: this.nsSearch.Type.SALES_TAX_ITEM,
      id: taxCode,
      columns: ["exempt", "rate", "itemid", "taxtype", "internalid"],
    });
    log.debug("Tax Code record", taxCodeRecord);
    if (taxCodeRecord && taxCodeRecord["itemid"]) {
      this.satTaxCodeCache[taxCode] = [taxCodeRecord];
      return [taxCodeRecord];
    }

    taxGroup = this.nsRecord.load({
      type: "taxgroup",
      id: taxCode,
    });

    var taxItems = [];
    var lineCount = taxGroup.getLineCount({
      sublistId: "taxitem",
    });

    for (var idx = 0; idx < lineCount; idx++) {
      var taxItemKey = taxGroup.getSublistValue({
        sublistId: "taxitem",
        fieldId: "taxitemnkey",
        line: idx,
      });

      var itemTaxBasis = taxGroup.getSublistValue({
        sublistId: "taxitem",
        fieldId: "basis",
        line: idx,
      });

      log.debug("Tax item key", taxItemKey);
      var taxItem = this.nsSearch.lookupFields({
        type: this.nsSearch.Type.SALES_TAX_ITEM,
        id: taxItemKey,
        columns: ["exempt", "rate", "itemid", "taxtype", "internalid"],
      });
      if (taxItem) taxItem["taxbasis"] = itemTaxBasis;
      taxItems.push(taxItem);
    }
    this.satTaxCodeCache[taxCode] = taxItems;
    return taxItems;
  };

  function getInstance(nsSearch, nsFormat, nsRecord) {
    return new LegacyTax(nsSearch, nsFormat, nsRecord);
  }

  return {
    getInstance: getInstance,
  };
});
