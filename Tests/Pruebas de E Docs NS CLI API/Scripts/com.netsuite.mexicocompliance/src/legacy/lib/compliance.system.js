/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 */

//ResourceMgr is designed to work on server side and client side scripts.
//Be mindful of this when adding new functionality or maintaining code.

var System = System || (new function _System()
{
    this.Components = new _Components();
    this.RemoveGlobalIdentifier = _RemoveGlobalIdentifier;
    this.LoadScript = _LoadScript;
	function _Components()
	{
		var _Components = {
			"SuiteScript": function _GetGlobal() { return this; } ()
		};
		this.Include = _Include;
		this.Use = _Use;

		function _Include(id, component)
		{
			if (id == null)
			{
				throw new Error("Components::Register() - Null component id");
			}
			if (component == null)
			{
				throw new Error("Components::Register() - Null component");
			}
			_Components[id] = component;

			_RemoveGlobalIdentifier(id);
		}

        function _Use(id)
        {
            if (id == null)
            {
                throw new Error("Components::Use() - Null component id");
            }
            if (_Components[id] === undefined)
            {
                throw new Error("Components::Use() - Undefined component [" + id + "]");
            }
            return _Components[id];
        }
    }

    function _RemoveGlobalIdentifier(id)
    {
        var GLOBAL_OBJECT = function() { return this; } ();
        if (id in GLOBAL_OBJECT)
        {
            GLOBAL_OBJECT[id] = undefined;
        }
    }

    function _LoadScript(sScript)
    {
        //Use annonymous function to eval sScript on global namespace
        (function() { eval("{" + sScript + "}"); } ());
    }
});