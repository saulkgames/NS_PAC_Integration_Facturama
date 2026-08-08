/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 */

//Hooks
function MXOnPageInit() { new MX_ValidationTool_CS().OnPageInit(); };
function MXOnFieldChanged(nsType, nsName) { new MX_ValidationTool_CS().OnFieldChanged(nsType, nsName); };

function MX_ValidationTool_CS()
{
    var IS_ONE_WORLD = nlapiGetContext().getSetting("FEATURE", "SUBSIDIARIES") == "T";
    this.OnPageInit = _OnPageInit;
    this.OnFieldChanged = _OnFieldChanged;
    this.OnPageInit = _OnPageInit;
    this.OnFieldChanged = _OnFieldChanged;

    function _OnPageInit()
    {
        _SetPeriodEnabled();
    }

    function _OnFieldChanged(nsType, nsName)
    {
        if (nsType == null && nsName == "entity")
        {
            _SetPeriodEnabled();
        }
    }

    function _SetPeriodEnabled()
    {
        var entityType = nlapiGetFieldValue("entity");
        var isEnabled = entityType === "vendorbill" ||
                        entityType === "vendorcredit" ||
                        entityType === "expensereport" ||
                        entityType === "check" ||
                        entityType === "all";
        var periodField = nlapiGetField("periodid");
        if (periodField) {
            if (isEnabled) {
                periodField.setDisplayType("normal");
            } else {
                periodField.setDisplayType("hidden");
            }
        }
    }
}