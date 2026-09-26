package mx.almetal.fama.harness;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapperBuilder;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.TemplateExceptionHandler;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Harness local para renderizar y validar plantillas FreeMarker (.ftl) de Electronic Invoicing
 * / Facturama antes de pegarlas en NetSuite. No sustituye una prueba real en sandbox — el motor
 * de NetSuite puede exponer detalles (tipos de dato exactos, campos adicionales) que un modelo
 * reconstruido a mano no capture perfectamente — pero atrapa errores de sintaxis FreeMarker y de
 * JSON resultante mucho antes y con mensajes mucho más precisos que el editor de NetSuite.
 *
 * Uso:
 *   java -jar freemarker-harness.jar <plantilla.ftl> <modelo.json> [--no-validate-json]
 *
 * El modelo (<modelo.json>) es un JSON con las variables de nivel superior que la plantilla
 * espera (ej. "transaction", "customer", "custom", "companyinformation"), reconstruidas a mano
 * a partir de los XML de los registros de NetSuite. Para representar un valor como fecha real de
 * FreeMarker (no un string plano), usar la convención {"__date__": "yyyy-MM-dd"} o
 * {"__date__": "yyyy-MM-dd HH:mm:ss"}.
 */
public final class FreemarkerHarness {

    private FreemarkerHarness() {
    }

    public static void main(String[] args) throws Exception {
        // Fuerza UTF-8 en la salida de consola; en Windows la codepage por defecto (Cp1252/850)
        // desfigura acentos/ñ en los mensajes del harness (no afecta el contenido renderizado,
        // que ya se lee/escribe explícitamente como UTF-8).
        System.setOut(new java.io.PrintStream(System.out, true, StandardCharsets.UTF_8));
        System.setErr(new java.io.PrintStream(System.err, true, StandardCharsets.UTF_8));

        if (args.length < 2) {
            System.err.println("Uso: java -jar freemarker-harness.jar <plantilla.ftl> <modelo.json> [--no-validate-json]");
            System.exit(1);
            return;
        }

        Path templatePath = Paths.get(args[0]).toAbsolutePath();
        Path modelPath = Paths.get(args[1]).toAbsolutePath();

        boolean validateJson = true;
        for (int i = 2; i < args.length; i++) {
            if ("--no-validate-json".equals(args[i])) {
                validateJson = false;
            }
        }

        if (!Files.isRegularFile(templatePath)) {
            System.err.println("ERROR: no existe la plantilla: " + templatePath);
            System.exit(1);
            return;
        }
        if (!Files.isRegularFile(modelPath)) {
            System.err.println("ERROR: no existe el modelo de datos: " + modelPath);
            System.exit(1);
            return;
        }

        Configuration cfg = new Configuration(Configuration.VERSION_2_3_34);
        cfg.setDirectoryForTemplateLoading(templatePath.getParent().toFile());
        cfg.setDefaultEncoding("UTF-8");
        cfg.setObjectWrapper(new DefaultObjectWrapperBuilder(Configuration.VERSION_2_3_34).build());
        cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
        cfg.setLogTemplateExceptions(false);
        cfg.setWrapUncheckedExceptions(true);
        cfg.setFallbackOnNullLoopVariable(false);

        Template template = cfg.getTemplate(templatePath.getFileName().toString());

        String modelJson = new String(Files.readAllBytes(modelPath), StandardCharsets.UTF_8);
        Object rawModel = new JSONTokener(modelJson).nextValue();
        if (!(rawModel instanceof JSONObject)) {
            System.err.println("ERROR: el modelo de datos debe ser un objeto JSON de nivel superior (ej. { \"transaction\": {...}, \"customer\": {...} }).");
            System.exit(1);
            return;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> dataModel = (Map<String, Object>) convert(rawModel);

        StringWriter outWriter = new StringWriter();
        try {
            template.process(dataModel, outWriter);
        } catch (TemplateException e) {
            System.err.println("=== ERROR DE RENDERIZADO (FreeMarker) ===");
            System.err.println(e.getMessage());
            System.exit(2);
            return;
        }

        String result = outWriter.toString();

        System.out.println("=== SALIDA RENDERIZADA ===");
        System.out.println(result);

        if (validateJson) {
            System.out.println();
            System.out.println("=== VALIDACIÓN JSON ===");
            String trimmed = result.trim();
            try {
                Object parsed = new JSONTokener(trimmed).nextValue();
                String kind = (parsed instanceof JSONArray) ? "arreglo" : (parsed instanceof JSONObject) ? "objeto" : "valor";
                System.out.println("OK: el resultado es JSON valido (" + kind + " de nivel superior).");
            } catch (JSONException je) {
                System.out.println("INVALIDO: " + je.getMessage());
                System.exit(3);
            }
        }
    }

    /**
     * Convierte lo que produce org.json (JSONObject/JSONArray/String/Number/Boolean/JSONObject.NULL)
     * a Map/List/String/Number/Boolean/null "planos" que el DefaultObjectWrapper de FreeMarker
     * puede envolver directamente, aplicando la convención {"__date__": "..."} para fechas reales
     * (necesarias para que ?string.iso / ?string("yyyy-MM-dd") funcionen igual que en NetSuite).
     * @param value Valor crudo devuelto por org.json.
     * @return Estructura equivalente usando tipos estándar de Java (Map, List, String, Number, Boolean, Date, null).
     */
    private static Object convert(Object value) throws java.text.ParseException {
        if (value instanceof JSONObject) {
            JSONObject obj = (JSONObject) value;
            if (obj.has("__date__")) {
                return parseDate(obj.getString("__date__"));
            }
            Map<String, Object> map = new LinkedHashMap<>();
            for (String key : obj.keySet()) {
                map.put(key, convert(obj.get(key)));
            }
            return map;
        } else if (value instanceof JSONArray) {
            JSONArray arr = (JSONArray) value;
            List<Object> list = new ArrayList<>();
            for (int i = 0; i < arr.length(); i++) {
                list.add(convert(arr.get(i)));
            }
            return list;
        } else if (value == JSONObject.NULL) {
            return null;
        } else {
            return value;
        }
    }

    /**
     * Devuelve un modelo de fecha de FreeMarker con tipo explícito (DATE o DATETIME), no un
     * java.util.Date crudo. FreeMarker no puede resolver ?string.iso/?string(pattern) sobre un
     * Date "sin tipo" (no sabe si es fecha, hora o fecha-hora) — por eso NetSuite, que sí expone
     * sus campos de fecha nativos con tipo definido, no tiene este problema, pero un Date armado
     * a mano en Java sí lo tiene si no se envuelve explícitamente así.
     */
    private static freemarker.template.SimpleDate parseDate(String value) throws java.text.ParseException {
        boolean hasTime = value.length() > 10;
        String pattern = hasTime ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd";
        SimpleDateFormat sdf = new SimpleDateFormat(pattern);
        Date parsed = sdf.parse(value);
        int type = hasTime ? freemarker.template.TemplateDateModel.DATETIME : freemarker.template.TemplateDateModel.DATE;
        return new freemarker.template.SimpleDate(parsed, type);
    }
}
