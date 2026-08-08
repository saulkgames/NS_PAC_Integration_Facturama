/**
 * Copyright © 2014, 2018, Oracle and/or its affiliates. All rights reserved.
 */

var TAF = TAF || {};
TAF.Translation = TAF.Translation || {};
 
TAF.Translation.ja = TAF.Translation.ja || {
	Culture: 'ja',
	Strings: {
		MAPPER_FORM_TITLE: 'Mexico Localization フィールドマッピング',
		MAPPER_EDIT_BUTTON: '編集',
		MAPPER_CANCEL_BUTTON: 'キャンセル',
		MAPPER_SUBLIST_NAME: 'マッピング',
		MAPPER_CATEGORY_LABEL: 'カテゴリ',
		MAPPER_TO_LABEL: '値',
		MAPPER_SAVE_SUCCESSFUL: '正常に保存されました。',
		MAPPER_SAVE_ERROR: '一部の変更は保存されませんでした。ページを更新してください。',
		MAPPER_SUCCESS: '確認',
		MAPPER_ERROR: 'エラー',
		MAPPER_RELOAD_WARNING_MESSAGE: 'このページに入力したデータは未保存であり、データは失われます。続行するには「OK」を押します。',
		TAF_MAPPING_BANK: '銀行',
		TAF_MAPPING_PAYMENT_METHOD: '支払方法',
		TAF_MAPPING_ACCOUNT_TYPE: '勘定科目の種類',
		TAF_MAPPING_ACCOUNT: '勘定',
		TAF_MAPPING_SUBSIDIARY: '連結子会社',
		TAF_MAPPING_TRANSACTION_TYPE: 'トランザクションの種類',
		TAF_MAPPING_POLICY_TYPE: 'ポリシー',
		TAF_MAPPING_UNIT_OF_MEASURE: '計量単位',
		TAF_MAPPING_UNITS_TYPE: '単位の種類',
		TAF_MAPPING_TAX_CATEGORY: '税金の種類',
		TAF_MAPPING_TAX_FACTOR_TYPE: '税金コード',
		CUSTPAGE_CATEGORY_FIELD_HELP: 'マッピングするフィールドを選択します。マッピングタブでは、右側の列に値を指定することで、SAT定義のカテゴリにNetSuiteのフィールドをマッピングできます。 <br /><br />勘定科目グループについては、CSVインポートを使用して、メキシコの連結子会社に割り当てられている勘定科目をSAT定義のグループコードにマッピングする必要があります。 <br /><br />「設定」>「Mexico Localization」>「SAT単位コードを管理」で、SAT単位コードを最初に定義する必要があります。 <br /><br />マッピングされたフィールドは、システムに保存された後、電子請求書作成や電子会計で利用されます。',
		CUSTPAGE_ACCOUNT_TYPE_FIELD_HELP: 'マッピングする勘定科目の種類を選択します。選択した勘定科目の値が「マッピング」タブに表示されます。',
		CUSTPAGE_SUBSIDIARY_FIELD_HELP: '値をマッピングする連結子会社を選択します。',
		CUSTPAGE_UNITS_OF_MEASURE_FIELD_HELP: 'マッピングする単位の種類を選択します。',
		GENERAL_LEDGER: '総勘定元帳',
		SII_RETROACTIVE_DESCRIPTION: '上半期からの登録',
        WITHHOLDING: '源泉徴収',
	},
};