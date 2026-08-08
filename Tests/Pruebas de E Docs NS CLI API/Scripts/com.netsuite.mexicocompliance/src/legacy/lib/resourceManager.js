define([
    "N/log",
    "N/error",
    "./locales/compliance.mx.EN",
    "./locales/compliance.mx.ES",
    "./locales/compliance.mx.PT",
],
    function (log, en, es, pt) {
        function resourceManager(cultureId) {
            this.GetString = _GetString;
            this.en = en;
            this.es = es;
            this.pt = pt;

            let _ResourceSet = null;

            (function _constructor(cultureId) {
                _ResourceSet = _LoadResourceSet(
                    cultureId === undefined ? "en" : cultureId
                );
            })(cultureId);

            function _LoadResourceSet(cultureId) {
                if (cultureId == null || cultureId === "") {
                    throw error.create({
                        name: "ResourceMgr::_LoadResourceSet()",
                        message: "Cannot Load empty or null culture Id.",
                        notifyOff: false
                    });
                }

                let cid = cultureId.toLowerCase();
                let allRS = _GetAvailableResourceSets();
                if (allRS[cid] !== undefined) return allRS[cid];

                let language = cid.split("_")[0];
                if (allRS[language] !== undefined) return allRS[language];

                return allRS["en"];
            }

            function _GetAvailableResourceSets() {
                if (_GetAvailableResourceSets.Cache == null) {
                    _GetAvailableResourceSets.Cache = {};
                    (function (
                        cache
                    ) {
                        for (let x in this) {
                            try {
                                if (
                                    this[x] != null &&
                                    typeof this[x] != "boolean" &&
                                    typeof this[x] != "string" &&
                                    typeof this[x] != "number" && //not primitive type?
                                    typeof this[x].Culture == "string"
                                ) {
                                    // Changed checking from using "in" operator because IE passes other data with "unknown" type)
                                    cache[this[x].Culture.toLowerCase()] = this[x];
                                }
                            } catch (e) {
                                log.error("Failed to access property '" + x + "'", e.message);
                            }
                        }
                    })(_GetAvailableResourceSets.Cache);
                }
                return _GetAvailableResourceSets.Cache;
            }

            _GetAvailableResourceSets.Cache = null;

            function _GetString(key, bindValues) {
                if (_ResourceSet != null && _ResourceSet.Strings[key] !== undefined) {
                    return bindValues === undefined
                        ? _ResourceSet.Strings[key]
                        : _BindString(_ResourceSet.Strings[key], bindValues);
                }

                return "{" + key + "}";
            }

            function _BindString(str, values) {
                if (str == null) return str;

                if (values == null) return str;

                let bindStr = str;

                for (let m in values) {
                    bindStr = bindStr.replace(new RegExp("\\{" + m + "\\}", "g"), values[m]);
                }

                return bindStr;
            }
        }

        return {
            resourceManager: resourceManager,
        };
    }
);