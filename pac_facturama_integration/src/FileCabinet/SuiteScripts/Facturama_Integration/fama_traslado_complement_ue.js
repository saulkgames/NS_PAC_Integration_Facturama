/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 *
 * Adaptador primario (orquestador) del Complemento Carta Porte para el Comprobante de Traslado
 * (Item Fulfillment). Punto de entrada del flujo y único módulo, junto con
 * ./lib/sads_fama_sat_catalog, autorizado a tocar NetSuite (N/record aquí; N/search dentro del
 * catálogo). Carga el registro y sus custom records relacionados
 * (Ubicacion/Transporte/FiguraTransporte/Remolque), los traduce a un DTO plano, delega la
 * resolución de Clave de Unidad SAT a ./lib/sads_fama_sat_catalog y la construcción del JSON
 * final a ./lib/sads_fama_carta_porte_mapper — que no importa ni conoce ningún módulo N/*.
 *
 * Los errores se registran vía sads_fama_logger y no se relanzan, para no bloquear el guardado.
 */
define([
    'N/record',
    'N/query',
    './lib/sads_fama_logger',
    './lib/sads_fama_carta_porte_mapper',
    './lib/sads_fama_sat_catalog'
], function (record, query, logger, cartaPorteMapper, satCatalog) {
    'use strict';

    var FIELDS = {
        PAYLOAD: 'custbody_sads_fama_cartaporte_payload'
    };
    var AUTOTRANSPORTE_FEDERAL = 'Autotransporte Federal';

    // ------------------------------------------------------------------------------------
    // Repositorio de registros relacionados (N/record, N/query). Frontera de infraestructura:
    // nada de lo que sale de aquí es un objeto Record — todo se traduce a valores planos antes
    // de cruzar hacia el mapper de dominio.
    // ------------------------------------------------------------------------------------

    /** @private */
    function _loadOrNull(recordType, id) {
        if (!id) return null;
        try {
            return record.load({ type: recordType, id: id, isDynamic: false });
        } catch (e) {
            logger.write('_loadOrNull: no se pudo cargar ' + recordType + ' id=' + id, {
                error: e.message || e.toString()
            });
            return null;
        }
    }

    /**
     * Devuelve la parte anterior al divisor (ej. "TPAF01: Autotransporte..." -> "TPAF01"). Si el
     * divisor no aparece, devuelve la cadena completa sin tocar.
     * @private
     */
    function _quitaDescripcion(cadena, divisor) {
        if (!cadena) return '';
        var idx = cadena.indexOf(divisor);
        return idx === -1 ? cadena : cadena.substring(0, idx);
    }

    /**
     * @private
     * @param {string|number} ubicacionId - Referencia a customrecord_drt_cp_ubicacion.
     * @param {string} tipoUbicacion - "Origen" o "Destino".
     * @param {string} idTexto - Ej. "OR000001".
     * @param {Object} overrides - {fechaHoraSalidaLlegada, distanciaRecorrida} — vienen de la
     *   cabecera de la transacción, no del custom record.
     * @returns {Object} DTO plano, ver sads_fama_carta_porte_mapper.buildUbicaciones.
     */
    function _ubicacionToDTO(ubicacionId, tipoUbicacion, idTexto, overrides) {
        var rec = _loadOrNull('customrecord_drt_cp_ubicacion', ubicacionId);

        var dto = {
            tipoUbicacion: tipoUbicacion,
            idUbicacion: idTexto,
            rfcRemitenteDestinatario: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_rfc' }) : null,
            nombreRemitenteDestinatario: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_nombre_rd' }) : null,
            fechaHoraSalidaLlegada: overrides.fechaHoraSalidaLlegada,
            domicilio: {
                calle: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_calle' }) : null,
                numeroExterior: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_numeroexterior' }) : null,
                numeroInterior: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_numerointerior' }) : null,
                colonia: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_colonia' }) : null,
                localidad: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_localidad' }) : null,
                referencia: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_referencia' }) : null,
                municipio: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_municipio' }) : null,
                estado: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_estado' }) : null,
                // customrecord_drt_cp_ubicacion no tiene un campo de país propio; se usa Residencia Fiscal.
                pais: rec ? rec.getText({ fieldId: 'custrecord_drt_pc_ubi_residencia_fiscal' }) : null,
                codigoPostal: rec ? rec.getValue({ fieldId: 'custrecord_drt_pc_ubi_codigopostal' }) : null
            }
        };

        if (tipoUbicacion !== 'Origen') {
            dto.distanciaRecorrida = overrides.distanciaRecorrida;
        }

        return dto;
    }

    /**
     * @private
     * @param {string|number} figuraId - Referencia a customrecord_drt_cp_figura_transporte.
     * @returns {Object} DTO plano, ver sads_fama_carta_porte_mapper.buildFiguraTransporte.
     */
    function _figuraToDTO(figuraId) {
        var rec = _loadOrNull('customrecord_drt_cp_figura_transporte', figuraId);
        return {
            tipoFigura: _quitaDescripcion(rec ? rec.getText({ fieldId: 'custrecord_drt_cp_tipofigura' }) : null, ' -'),
            rfcFigura: rec ? rec.getValue({ fieldId: 'custrecord_drt_cp_rfcfigura' }) : null,
            numLicencia: rec ? rec.getValue({ fieldId: 'custrecord_drt_cp_ft_numlicencia' }) : null,
            nombreFigura: rec ? rec.getValue({ fieldId: 'custrecord_drt_cp_nombrefigura' }) : null
        };
    }

    /**
     * Consulta los Remolques relacionados a un Transporte en una sola query.
     * @private
     * @returns {Array<Object>} [{subTipoRem, placa}, ...]
     */
    function _remolquesDTO(transporteId) {
        if (!transporteId) return [];

        try {
            var sql = 'SELECT BUILTIN.DF(custrecord_drt_cp_subtiporem) AS subtiporem, custrecord_drt_cp_placa AS placa ' +
                'FROM customrecord_drt_cp_remolque WHERE custrecord_drt_cp_transporte = ?';
            var rows = query.runSuiteQL({ query: sql, params: [transporteId] }).asMappedResults();

            return rows.map(function (row) {
                // BUILTIN.DF devuelve "CODIGO: Descripción" (texto de la lista); Facturama
                // espera solo el código del catálogo SAT c_SubTipoRem.
                return { subTipoRem: _quitaDescripcion(row.subtiporem, ':'), placa: row.placa };
            });
        } catch (e) {
            logger.write('_remolquesDTO: fallo consultando customrecord_drt_cp_remolque', {
                transporteId: transporteId,
                error: e.message || e.toString()
            });
            return [];
        }
    }

    /**
     * @private
     * @param {string|number} transporteId - Referencia a customrecord_drt_cp_transporte.
     * @param {number|string} pesoBrutoVehicular - Override de cabecera, no vive en el custom record.
     * @returns {Object} DTO plano, ver sads_fama_carta_porte_mapper.buildAutotransporte.
     */
    function _autotransporteToDTO(transporteId, pesoBrutoVehicular) {
        var rec = _loadOrNull('customrecord_drt_cp_transporte', transporteId);

        if (rec) {
            var tipoTransporteRec = parseInt(rec.getValue({ fieldId: 'custrecord_drt_cp_tipo_transporte' }), 10);
            if (tipoTransporteRec !== 1) {
                logger.write('_autotransporteToDTO: custrecord_drt_cp_transporte no es Autotransporte Federal (1)', {
                    transporteId: transporteId,
                    custrecord_drt_cp_tipo_transporte: tipoTransporteRec
                });
            }
        }

        return {
            permSct: _quitaDescripcion(rec ? rec.getText({ fieldId: 'custrecord_drt_cp_permsct' }) : null, ':'),
            numPermisoSct: rec ? rec.getValue({ fieldId: 'custrecord_drt_cp_numpermisosct' }) : null,
            identificacionVehicular: {
                configVehicular: _quitaDescripcion(rec ? rec.getText({ fieldId: 'custrecord_drt_cp_configvehicular' }) : null, ':'),
                pesoBrutoVehicular: pesoBrutoVehicular,
                placaVm: rec ? rec.getValue({ fieldId: 'custrecord_drt_cp_placavm' }) : null,
                anioModeloVm: rec ? rec.getValue({ fieldId: 'custrecord_drt_cp_anio' }) : null
            },
            seguros: {
                aseguraRespCivil: rec ? rec.getValue({ fieldId: 'custrecord_drt_cp_asegurarespcivil' }) : null,
                polizaRespCivil: rec ? rec.getValue({ fieldId: 'custrecord_drt_cp_polizarespcivil' }) : null
            },
            remolques: _remolquesDTO(transporteId)
        };
    }

    /**
     * Extrae el DTO plano de una línea de sublista. La resolución de Clave de Unidad se deja
     * fuera (queda null) — se resuelve en batch para todas las líneas juntas, ver
     * _buildComplementoDTO, y se rellena después de esta llamada.
     * @private
     */
    function _lineaSublistDTO(rec, lineIndex, idOrigen, idDestino) {
        var satItemCodeText = rec.getSublistText({ sublistId: 'item', fieldId: 'custcol_mx_txn_line_sat_item_code', line: lineIndex });
        var claveMatch = satItemCodeText ? satItemCodeText.match(/\d{8}/) : null;

        return {
            tieneSatItemCode: !!satItemCodeText,
            bienesTransp: claveMatch ? claveMatch[0] : null,
            descripcion: rec.getSublistValue({ sublistId: 'item', fieldId: 'description', line: lineIndex }),
            cantidad: rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: lineIndex }),
            pesoEnKg: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_drt_cp_pesoenkg', line: lineIndex }),
            materialPeligroso: rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_drt_cp_materialpeligroso', line: lineIndex }) === true,
            unitId: rec.getSublistValue({ sublistId: 'item', fieldId: 'units', line: lineIndex }),
            claveUnidad: null,
            idOrigen: idOrigen,
            idDestino: idDestino
        };
    }

    /**
     * Filtro de inclusión de ESTE adaptador (Item Fulfillment): una línea es mercancía
     * transportada cuando trae texto en custcol_mx_txn_line_sat_item_code. Otros adaptadores
     * (ej. Factura de venta) pueden usar un criterio distinto sin tocar este archivo.
     * @private
     */
    function _esLineaDeMercancia(lineaSublistDTO) {
        return lineaSublistDTO.tieneSatItemCode;
    }

    // ------------------------------------------------------------------------------------
    // Ensamblado del DTO raíz — cruza N/record + N/search (vía sads_fama_sat_catalog) y entrega
    // un objeto 100% plano al mapper de dominio, que no sabe que NetSuite existe.
    // ------------------------------------------------------------------------------------

    /**
     * @private
     * @param {Record} rec - Ejecución de Orden de Venta ya cargada (isDynamic:false).
     * @returns {Object} DTO raíz, ver sads_fama_carta_porte_mapper.buildComplemento.
     */
    function _buildComplementoDTO(rec) {
        var idOrigenTexto = rec.getValue({ fieldId: 'custbody_drt_cp_id_origen' });
        var idDestinoTexto = rec.getValue({ fieldId: 'custbody_drt_cp_id_destino' });

        var ubicaciones = [
            _ubicacionToDTO(rec.getValue({ fieldId: 'custbody_drt_cp_origen' }), 'Origen', idOrigenTexto, {
                fechaHoraSalidaLlegada: rec.getValue({ fieldId: 'custbody_drt_cp_fechahora_salida' })
            }),
            _ubicacionToDTO(rec.getValue({ fieldId: 'custbody_drt_cp_destino' }), 'Destino', idDestinoTexto, {
                fechaHoraSalidaLlegada: rec.getValue({ fieldId: 'custbody_drt_cp_fechahora_llegada' }),
                distanciaRecorrida: rec.getValue({ fieldId: 'custbody_drt_cp_totaldistrec' })
            })
        ];

        var figuraIds = rec.getValue({ fieldId: 'custbody_drt_cp_figura_transporte' });
        figuraIds = Array.isArray(figuraIds) ? figuraIds : (figuraIds ? [figuraIds] : [null]);
        var figurasTransporte = figuraIds.map(_figuraToDTO);

        var autotransporte = _autotransporteToDTO(
            rec.getValue({ fieldId: 'custbody_drt_cp_transporte' }),
            rec.getValue({ fieldId: 'custbody_drt_cp_peso_bruto_vehicular' })
        );

        // Líneas de mercancía: se extraen TODAS primero (con su unitId crudo) para poder resolver
        // Clave de Unidad en una sola consulta batched antes de formatear cualquier JSON.
        var lineCount = rec.getLineCount({ sublistId: 'item' });
        var todasLasLineas = [];
        for (var i = 0; i < lineCount; i++) {
            todasLasLineas.push(_lineaSublistDTO(rec, i, idOrigenTexto, idDestinoTexto));
        }

        var lineasMercancia = todasLasLineas.filter(_esLineaDeMercancia);

        var unitIdsUnicos = lineasMercancia
            .map(function (l) { return l.unitId; })
            .filter(function (v, idx, arr) { return v && arr.indexOf(v) === idx; });
        var clavesUnidad = satCatalog.resolveClavesUnidad(unitIdsUnicos, logger);
        lineasMercancia.forEach(function (l) { l.claveUnidad = clavesUnidad[l.unitId]; });

        var registroIstmoText = rec.getText({ fieldId: 'custbody_drt_cp_registro_istmo' }) ||
            rec.getValue({ fieldId: 'custbody_drt_cp_registro_istmo' });

        var dto = {
            idCcp: rec.getValue({ fieldId: 'custbody_mcp_idccp' }),
            transpInternac: rec.getText({ fieldId: 'custbody_drt_cp_transpinternac' }) || 'No',
            totalDistRec: rec.getValue({ fieldId: 'custbody_drt_cp_totaldistrec' }),
            ubicaciones: ubicaciones,
            figurasTransporte: figurasTransporte,
            autotransporte: autotransporte,
            mercancias: {
                lineas: lineasMercancia,
                unidadPeso: rec.getValue({ fieldId: 'custbody_drt_cp_clave_unidadpeso' }),
                logisticaInversa: rec.getText({ fieldId: 'custbody_drt_cp_logistica_inversa_rede' })
            }
        };

        if (registroIstmoText && registroIstmoText !== 'No') {
            dto.registroIstmo = registroIstmoText;
            dto.ubicacionPoloOrigen = rec.getValue({ fieldId: 'custbody_drt_cp_ubicacion_polo_origen' });
            dto.ubicacionPoloDestino = rec.getValue({ fieldId: 'custbody_drt_cp_ubicacion_polo_destino' });
        }

        return dto;
    }

    // ------------------------------------------------------------------------------------
    // Orquestación (punto de entrada del User Event)
    // ------------------------------------------------------------------------------------

    /**
     * Tras crear/editar la Ejecución de Orden de Venta, construye y persiste el payload del
     * Complemento Carta Porte.
     * @param {Object} context - Contexto del User Event.
     * @returns {void}
     */
    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
            return;
        }

        var recId = context.newRecord.id;

        try {
            var rec = context.newRecord;

            var complementoFlag = rec.getValue({ fieldId: 'custbody_drt_cp_complemento_cartaporte' });
            if (complementoFlag !== true) {
                logger.write('fama_traslado_complement_ue: sin Complemento Carta Porte marcado', { recId: recId });
                return;
            }

            var tipoTransporte = rec.getText({ fieldId: 'custbody_drt_cp_tipo_transporte' }) ||
                rec.getValue({ fieldId: 'custbody_drt_cp_tipo_transporte' });
            if (tipoTransporte && tipoTransporte !== AUTOTRANSPORTE_FEDERAL) {
                logger.write('fama_traslado_complement_ue: tipo de transporte no soportado todavía', {
                    recId: recId,
                    tipoTransporte: tipoTransporte
                });
                return;
            }

            var freshRec = record.load({ type: rec.type, id: recId, isDynamic: false });

            // Frontera de dominio: de aquí en adelante solo existe el DTO plano — cartaPorteMapper
            // no recibe ni conoce el objeto Record de NetSuite.
            var dto = _buildComplementoDTO(freshRec);
            var complemento = cartaPorteMapper.buildComplemento(dto);

            _persistPayload(recId, rec, complemento);

        } catch (e) {
            logger.write('ERROR: fama_traslado_complement_ue.afterSubmit', {
                recId: recId,
                message: e.message || e.toString(),
                stack: e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'Sin stack trace')
            });
        }
    }

    /**
     * Persiste el payload del Complemento Carta Porte en el registro.
     * @private
     */
    function _persistPayload(recId, rec, complemento) {
        var newPayload = JSON.stringify(complemento);
        var currentPayload = rec.getValue({ fieldId: FIELDS.PAYLOAD });

        if (currentPayload === newPayload) {
            return;
        }

        var values = {};
        values[FIELDS.PAYLOAD] = newPayload;

        record.submitFields({
            type: record.Type.ITEM_FULFILLMENT,
            id: recId,
            values: values,
            options: { enablesourcing: false, ignoreMandatoryFields: true }
        });

        logger.write('fama_traslado_complement_ue: payload generado', {
            recId: recId,
            complemento: complemento
        });
    }

    return { afterSubmit: afterSubmit };
});
