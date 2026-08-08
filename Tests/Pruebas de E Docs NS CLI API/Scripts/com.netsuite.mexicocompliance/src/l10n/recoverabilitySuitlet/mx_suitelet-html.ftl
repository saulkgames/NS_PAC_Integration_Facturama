<style type="text/css">
    .localization-components {
        margin-top: 5px;
        padding: 5px;
    }
    .localization-components th {
        font-size: 13px;
        font-weight: bold;
        text-transform: uppercase;
    }
    .localization-components td {
        font-size: 14px;
    }
    .localization-components td.result-status a {
        cursor: default;
        text-decoration: none;
    }
    .localization-components td.result-status a.error-status {
        border-bottom: 1px dotted black;
        cursor: help;
    }
    .localization-components tbody tr:hover {
        background: #EAEAEA;
    }
    .localization-header {
        padding: 5px;
        font-size: 14px;
        color: #607799;
        font-weight: bold;
        background: #E0E6EF;
    }
    .localization-container {
        margin-bottom: 20px;
    }
</style>
<script type="text/javascript">
    function l10nReinstall(obj, params) {
        require(['${templateData.csFilePath}'], function(clientScript) {
            clientScript.reinstall(obj, params);
        });
        return false;
    }
    function l10nShowDetails(obj, params) {
        require(['${templateData.csFilePath}'], function(clientScript) {
            clientScript.showDetails(obj, params);
        });
        return false;
    }
</script>
<div>
 
    <#list templateData.targets as target>
    <div class="localization-container">
        <div class="localization-header">${target}</div>
        <table class="localization-components" width="100%" cellpadding="1" cellspacing="0">
            <thead>
                <tr>
                    <th width="25%">${templateData.pageHeaderLabels.LABEL_COMPONENT}</th>
                    <th width="15%">${templateData.pageHeaderLabels.LABEL_STATUS}</th>
                    <th width="20%">${templateData.pageHeaderLabels.LABEL_UPDATEDATE}</th>
                    <th width="20%">${templateData.pageHeaderLabels.LABEL_UPDATEDBY}</th>
                    <th width="20%">${templateData.pageHeaderLabels.LABEL_ACTION}</th>
                </tr>
            </thead>
            <tbody>
                <#list templateData.results as result>
                    <#if target == result.target>
                <tr id="localizationComponent${result.id}">
                    <td>${result.name}</td>
                    <td class="result-status">
                        <a href="#" class="<#if result.errorStatus=='true'>error-status</#if>" onClick="return l10nShowDetails(this);" data-details="${result.details}">${result.status}</a>
                    </td>
                    <td class="result-modifieddate">${result.modifieddate}</td>
                    <td class="result-modifiedby">${result.modifiedby}</td>
                    <td><a href="#" onClick="return l10nReinstall(this, {id: ${result.id}, name: '${result.name}'})">Reinstall</a></td>
                </tr>
                    </#if>
                </#list>
            </tbody>
        </table>
    </div>
    </#list>
</div>