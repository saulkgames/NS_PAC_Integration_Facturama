/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * Núcleo de dominio (Builder) del Complemento Carta Porte (esquema Facturama, CartaPorte31).
 *
 * Frontera de Clean Architecture: este módulo ES EL DOMINIO. No conoce NetSuite ni ningún
 * detalle de infraestructura — su matriz de dependencias en define() está vacía a propósito, y
 * debe permanecer así. Recibe únicamente DTOs (objetos planos ya resueltos por el adaptador
 * User Event y por el repositorio de catálogo SAT) y devuelve JSON puro. Ningún módulo N/* puede
 * entrar aquí, ni directa ni transitivamente — si una función de este archivo alguna vez
 * necesita leer un registro o hacer una búsqueda, esa lectura NO va aquí: va en el adaptador que
 * arma el DTO antes de llamar a este módulo.
 *
 * Todo campo no encontrado se reemplaza por "{nombreCampo}_vacia" en vez de lanzar una excepción
 * (modo diagnóstico: el hueco debe quedar visible en el payload, no bloquear el timbrado).
 */
define([], function () {
    'use strict';

    /**
     * @param {*} valor
     * @param {string} nombreCampo
     * @returns {string} valor como string, o "{nombreCampo}_vacia" si está vacío/ausente.
     */
    function strOrVacio(valor, nombreCampo) {
        if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
            return String(valor);
        }
        return nombreCampo + '_vacia';
    }

    /**
     * Como strOrVacio, para valores numéricos. Limpia comas antes de parsear.
     * @param {*} valor
     * @param {number} decimales
     * @param {string} nombreCampo
     * @returns {string}
     */
    function numOrVacio(valor, decimales, nombreCampo) {
        if (valor === null || valor === undefined || String(valor).trim() === '') {
            return nombreCampo + '_vacia';
        }
        var limpio = String(valor).replace(/,/g, '');
        var num = parseFloat(limpio);
        if (isNaN(num) || !isFinite(num)) {
            return nombreCampo + '_vacia';
        }
        return num.toFixed(decimales);
    }

    /**
     * @private
     * @param {Date|string} dateValue
     * @returns {string} "yyyy-MM-ddTHH:mm:ss"
     */
    function _isoDateTime(dateValue) {
        var d = (dateValue instanceof Date) ? dateValue : new Date(dateValue);
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    /**
     * Construye una Ubicacion (Origen o Destino) a partir de su DTO ya resuelto.
     * @private
     * @param {Object} dto - {tipoUbicacion, idUbicacion, rfcRemitenteDestinatario,
     *   nombreRemitenteDestinatario, fechaHoraSalidaLlegada, distanciaRecorrida, domicilio}
     * @returns {Object}
     */
    function _buildUbicacion(dto) {
        var esOrigen = dto.tipoUbicacion === 'Origen';
        var out = {
            "TipoUbicacion": dto.tipoUbicacion,
            "IDUbicacion": strOrVacio(dto.idUbicacion, esOrigen ? 'custbody_drt_cp_id_origen' : 'custbody_drt_cp_id_destino'),
            "RFCRemitenteDestinatario": strOrVacio(dto.rfcRemitenteDestinatario, 'ubicacion_rfcremitentedestinatario'),
            "NombreRemitenteDestinatario": strOrVacio(dto.nombreRemitenteDestinatario, 'ubicacion_nombreremitentedestinatario')
        };

        if (esOrigen) {
            out.FechaHoraSalidaLlegada = dto.fechaHoraSalidaLlegada ? _isoDateTime(dto.fechaHoraSalidaLlegada) : 'custbody_drt_cp_fechahora_salida_vacia';
        } else {
            out.FechaHoraSalidaLlegada = dto.fechaHoraSalidaLlegada ? _isoDateTime(dto.fechaHoraSalidaLlegada) : 'custbody_drt_cp_fechahora_llegada_vacia';
            out.DistanciaRecorrida = numOrVacio(dto.distanciaRecorrida, 2, 'custbody_drt_cp_totaldistrec');
        }

        var dom = dto.domicilio || {};
        out.Domicilio = {
            "Calle": strOrVacio(dom.calle, 'ubicacion_domiciliocalle'),
            "NumeroExterior": strOrVacio(dom.numeroExterior, 'ubicacion_domicilionumext'),
            "NumeroInterior": strOrVacio(dom.numeroInterior, 'ubicacion_domicilionumint'),
            "Colonia": strOrVacio(dom.colonia, 'ubicacion_domiciliocolonia'),
            "Localidad": strOrVacio(dom.localidad, 'ubicacion_domiciliolocalidad'),
            "Referencia": strOrVacio(dom.referencia, 'ubicacion_domicilioreferencia'),
            "Municipio": strOrVacio(dom.municipio, 'ubicacion_domiciliomunicipio'),
            "Estado": strOrVacio(dom.estado, 'ubicacion_domicilioestado'),
            "Pais": strOrVacio(dom.pais, 'ubicacion_domiciliopais'),
            "CodigoPostal": strOrVacio(dom.codigoPostal, 'ubicacion_domiciliocodigopostal')
        };

        return out;
    }

    /**
     * @param {Array<Object>} ubicacionesDTO - [origenDTO, destinoDTO], ver _buildUbicacion.
     * @returns {Array<Object>}
     */
    function buildUbicaciones(ubicacionesDTO) {
        return (ubicacionesDTO || []).map(_buildUbicacion);
    }

    /**
     * @param {Array<Object>} figurasDTO - [{tipoFigura, rfcFigura, numLicencia, nombreFigura}, ...]
     * @returns {Array<Object>}
     */
    function buildFiguraTransporte(figurasDTO) {
        return (figurasDTO || []).map(function (fig) {
            return {
                "TipoFigura": strOrVacio(fig.tipoFigura, 'figtransp_tipofigura'),
                "RFCFigura": strOrVacio(fig.rfcFigura, 'figtransp_rfcfigura'),
                "NumLicencia": strOrVacio(fig.numLicencia, 'figtransp_numlicencia'),
                "NombreFigura": strOrVacio(fig.nombreFigura, 'figtransp_nombrefigura')
            };
        });
    }

    /**
     * Construye Autotransporte (objeto único, no arreglo — así lo exige Facturama) a partir de
     * su DTO ya resuelto. `remolques` ya viene decidido por el llamador (arreglo, posiblemente
     * vacío) — este módulo no decide si aplican o no, solo los transcribe si vienen.
     * @param {Object} dto - {permSct, numPermisoSct, identificacionVehicular, seguros, remolques}
     * @returns {Object}
     */
    function buildAutotransporte(dto) {
        var idVeh = dto.identificacionVehicular || {};
        var seguros = dto.seguros || {};

        var out = {
            "PermSCT": strOrVacio(dto.permSct, 'transporte_permsct'),
            "NumPermisoSCT": strOrVacio(dto.numPermisoSct, 'transporte_numpermisosct'),
            "IdentificacionVehicular": {
                "ConfigVehicular": strOrVacio(idVeh.configVehicular, 'transporte_configvehicular'),
                "PesoBrutoVehicular": numOrVacio(idVeh.pesoBrutoVehicular, 0, 'custbody_drt_cp_peso_bruto_vehicular'),
                "PlacaVM": strOrVacio(idVeh.placaVm, 'transporte_placavm'),
                "AnioModeloVM": strOrVacio(idVeh.anioModeloVm, 'transporte_aniomodelovm')
            },
            "Seguros": {
                "AseguraRespCivil": strOrVacio(seguros.aseguraRespCivil, 'transporte_asegurarespcivil'),
                "PolizaRespCivil": strOrVacio(seguros.polizaRespCivil, 'transporte_polizarespcivil')
            }
        };

        if (dto.remolques && dto.remolques.length > 0) {
            out.Remolques = dto.remolques.map(function (r) {
                return {
                    "SubTipoRem": strOrVacio(r.subTipoRem, 'remolque_subtiporem'),
                    "Placa": strOrVacio(r.placa, 'remolque_placarem')
                };
            });
        }

        return out;
    }

    /**
     * Construye Mercancias completo (Mercancia[] + Autotransporte anidado + totales
     * autocalculados). Cada línea de `lineasDTO` debe llegar YA resuelta (BienesTransp extraído,
     * ClaveUnidad ya cruzada contra el catálogo) — este módulo solo formatea y suma, no resuelve
     * catálogos ni hace ninguna llamada externa.
     *
     * PesoBrutoTotal/PesoNetoTotal se autocalculan sumando PesoEnKg de las líneas incluidas (se
     * mantienen iguales entre sí: este negocio despacha a granel, sin empaque declarado aparte).
     *
     * @param {Array<Object>} lineasDTO - [{bienesTransp, descripcion, cantidad, claveUnidad,
     *   pesoEnKg, materialPeligroso, idOrigen, idDestino}, ...]
     * @param {Object} autotransporteJSON - Ya armado por buildAutotransporte.
     * @param {Object} opciones - {unidadPeso, logisticaInversa}
     * @returns {Object}
     */
    function buildMercancias(lineasDTO, autotransporteJSON, opciones) {
        opciones = opciones || {};

        var mercancia = (lineasDTO || []).map(function (linea) {
            var item = {
                "BienesTransp": strOrVacio(linea.bienesTransp, 'itemsatcodes_itemcode'),
                "Descripcion": strOrVacio(linea.descripcion, 'item_item'),
                "Cantidad": numOrVacio(linea.cantidad, 6, 'item_quantity'),
                "ClaveUnidad": strOrVacio(linea.claveUnidad, 'item_claveunidad'),
                "PesoEnKg": numOrVacio(linea.pesoEnKg, 3, 'item_custcol_drt_cp_pesoenkg'),
                "CantidadTransporta": [{
                    "Cantidad": numOrVacio(linea.cantidad, 6, 'item_quantity'),
                    "IDOrigen": strOrVacio(linea.idOrigen, 'custbody_drt_cp_id_origen'),
                    "IDDestino": strOrVacio(linea.idDestino, 'custbody_drt_cp_id_destino')
                }]
            };
            // Facturama rechaza "No"; el atributo solo se declara cuando aplica.
            if (linea.materialPeligroso) {
                item.MaterialPeligroso = 'Sí';
            }
            return item;
        });

        var pesoTotalNum = 0;
        var pesoTotalCompleto = true;
        mercancia.forEach(function (m) {
            var num = parseFloat(m.PesoEnKg);
            if (isNaN(num)) {
                pesoTotalCompleto = false;
            } else {
                pesoTotalNum += num;
            }
        });
        var pesoTotal = pesoTotalCompleto ? pesoTotalNum.toFixed(3) : 'mercancia_pesoenkg_suma_vacia';

        var out = {
            "PesoBrutoTotal": pesoTotal,
            "UnidadPeso": strOrVacio(opciones.unidadPeso, 'custbody_drt_cp_clave_unidadpeso'),
            "PesoNetoTotal": pesoTotal,
            "NumTotalMercancias": String(mercancia.length),
            "Mercancia": mercancia,
            "Autotransporte": autotransporteJSON
        };

        // Facturama rechaza "No"; el atributo solo se declara cuando aplica.
        if (opciones.logisticaInversa === 'Sí') {
            out.LogisticaInversaRecoleccionDevolucion = opciones.logisticaInversa;
        }

        return out;
    }

    /**
     * Punto de entrada recomendado para los adaptadores: recibe el DTO raíz completo (ya
     * resuelto por el User Event correspondiente) y devuelve el objeto Complemento listo para
     * persistir/transportar a la plantilla FreeMarker.
     *
     * @param {Object} dto - {
     *   idCcp, transpInternac, totalDistRec,
     *   registroIstmo, ubicacionPoloOrigen, ubicacionPoloDestino,   // opcionales
     *   ubicaciones: [ubicacionDTO, ubicacionDTO],
     *   figurasTransporte: [figuraDTO, ...],
     *   autotransporte: autotransporteDTO,
     *   mercancias: { lineas: [lineaDTO, ...], unidadPeso, logisticaInversa }
     * }
     * @returns {Object} {CartaPorte31: {...}}
     */
    function buildComplemento(dto) {
        var cartaPorte31 = {
            "IdCCP": strOrVacio(dto.idCcp, 'custbody_mcp_idccp'),
            "TranspInternac": dto.transpInternac || 'No',
            "TotalDistRec": numOrVacio(dto.totalDistRec, 2, 'custbody_drt_cp_totaldistrec')
        };

        if (dto.registroIstmo && dto.registroIstmo !== 'No') {
            cartaPorte31.RegistroISTMO = dto.registroIstmo;
            cartaPorte31.UbicacionPoloOrigen = strOrVacio(dto.ubicacionPoloOrigen, 'custbody_drt_cp_ubicacion_polo_origen');
            cartaPorte31.UbicacionPoloDestino = strOrVacio(dto.ubicacionPoloDestino, 'custbody_drt_cp_ubicacion_polo_destino');
        }

        var mercanciasDTO = dto.mercancias || {};
        var autotransporteJSON = buildAutotransporte(dto.autotransporte || {});

        cartaPorte31.Ubicaciones = buildUbicaciones(dto.ubicaciones);
        cartaPorte31.Mercancias = buildMercancias(mercanciasDTO.lineas, autotransporteJSON, mercanciasDTO);
        cartaPorte31.FiguraTransporte = buildFiguraTransporte(dto.figurasTransporte);

        return { "CartaPorte31": cartaPorte31 };
    }

    return {
        strOrVacio: strOrVacio,
        numOrVacio: numOrVacio,
        buildUbicaciones: buildUbicaciones,
        buildFiguraTransporte: buildFiguraTransporte,
        buildAutotransporte: buildAutotransporte,
        buildMercancias: buildMercancias,
        buildComplemento: buildComplemento
    };
});
