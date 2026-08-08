/**
 * Copyright © 2014, 2018, Oracle and/or its affiliates. All rights reserved.
 */

var TAF = TAF || {};
TAF.Translation = TAF.Translation || {};
 
TAF.Translation.ru = TAF.Translation.ru || {
	Culture: 'ru',
	Strings: {
		MAPPER_FORM_TITLE: 'Mexico Localization Сопоставление полей',
		MAPPER_EDIT_BUTTON: 'Изменить',
		MAPPER_CANCEL_BUTTON: 'Отмена',
		MAPPER_SUBLIST_NAME: 'Отображение',
		MAPPER_CATEGORY_LABEL: 'Категория',
		MAPPER_TO_LABEL: 'Значение',
		MAPPER_SAVE_SUCCESSFUL: 'Успешно сохранено.',
		MAPPER_SAVE_ERROR: 'Некоторые изменения не были сохранены. Обновите страницу.',
		MAPPER_SUCCESS: 'Подтверждение',
		MAPPER_ERROR: 'Ошибка',
		MAPPER_RELOAD_WARNING_MESSAGE: 'Данные, введенные на этой странице, не были сохранены и будут потеряны. Нажмите кнопку ОК для продолжения.',
		TAF_MAPPING_BANK: 'Банк',
		TAF_MAPPING_PAYMENT_METHOD: 'Метод платежа',
		TAF_MAPPING_ACCOUNT_TYPE: 'Тип счета',
		TAF_MAPPING_ACCOUNT: 'Счет',
		TAF_MAPPING_SUBSIDIARY: 'Филиал',
		TAF_MAPPING_TRANSACTION_TYPE: 'Тип операции',
		TAF_MAPPING_POLICY_TYPE: 'Политика',
		TAF_MAPPING_UNIT_OF_MEASURE: 'Единица измерения',
		TAF_MAPPING_UNITS_TYPE: 'Тип единиц',
		TAF_MAPPING_TAX_CATEGORY: 'Тип налога',
		TAF_MAPPING_TAX_FACTOR_TYPE: 'Код налога',
		CUSTPAGE_CATEGORY_FIELD_HELP: 'Выберите поле для сопоставления. На вкладке сопоставления можно сопоставлять поля NetSuite с категориями SAT, указывая значения в столбце справа. <br /><br />Для группировки счетов необходимо использовать функцию импорта CSV, чтобы сопоставить счета, назначенные вашему мексиканскому филиалу, с кодами групп, установленными в SAT. <br /><br />Необходимо сначала настроить код единицы SAT в разделе «Настройка» &gt; Mexico Localization &gt; «Управление кодами единиц SAT».<br /><br />Сопоставленные поля будут использованы для файлов электронного выставления счетов или электронного бухучета после сохранения в системе.',
		CUSTPAGE_ACCOUNT_TYPE_FIELD_HELP: 'Выберите тип счета для сопоставления. Значения выбранного счета появятся на вкладке «Сопоставление».',
		CUSTPAGE_SUBSIDIARY_FIELD_HELP: 'Выберите филиал, для которых нужно сопоставить значения.',
		CUSTPAGE_UNITS_OF_MEASURE_FIELD_HELP: 'Выберите тип единиц для сопоставления.',
		GENERAL_LEDGER: 'Главная книга',
		SII_RETROACTIVE_DESCRIPTION: 'Регистрация с первой половины года',
        WITHHOLDING: 'Удержание',
	},
};