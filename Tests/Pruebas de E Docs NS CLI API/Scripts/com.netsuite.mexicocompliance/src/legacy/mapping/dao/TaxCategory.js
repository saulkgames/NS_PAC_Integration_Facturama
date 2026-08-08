/**
 * @copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */

if (!TAF) { var TAF = {}; }

TAF.TaxCategory = function _TaxType(id) {

  this.id = id;
  this.key = id;
  this.recordType = '';
  this.name = null;

  this.getId = function _GetId() { return this.id; };

  this.getName = function _GetName() { return this.name; };
  this.setName = function _SetName(value) { this.name = value; };

  this.setRecordType = function _SetRecordType (value) { this.recordType = value; };
  this.getRecordType = function _GetRecordType () { return this.recordType; };
};