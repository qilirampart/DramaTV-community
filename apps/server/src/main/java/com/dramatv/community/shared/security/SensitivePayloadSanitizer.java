package com.dramatv.community.shared.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class SensitivePayloadSanitizer {

    private static final String REDACTED = "[REDACTED]";
    private static final int MAX_TEXT_LENGTH = 512;
    private static final int MAX_ARRAY_ITEMS = 20;
    private static final int MAX_OBJECT_FIELDS = 40;
    private static final Pattern KEY_VALUE_SECRET_PATTERN = Pattern.compile(
            "(?i)\\b(authorization|token|signature|secret|credential|access[-_ ]?key|policy)\\b\\s*[:=]\\s*([^\\s,;\\]}\"']+)"
    );
    private static final Pattern BEARER_TOKEN_PATTERN = Pattern.compile(
            "(?i)\\bBearer\\s+[A-Za-z0-9._\\-+/=]+"
    );

    private final ObjectMapper objectMapper;

    public SensitivePayloadSanitizer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String sanitizeJsonValue(Object value) {
        if (value == null) {
            return null;
        }

        return sanitizeNode(objectMapper.valueToTree(value)).toString();
    }

    public String sanitizeJsonText(String rawJson) {
        if (!StringUtils.hasText(rawJson)) {
            return rawJson;
        }

        try {
            return sanitizeNode(objectMapper.readTree(rawJson)).toString();
        } catch (Exception ignored) {
            return sanitizeText(rawJson);
        }
    }

    public String sanitizeText(String rawText) {
        if (!StringUtils.hasText(rawText)) {
            return rawText;
        }

        return truncateText(redactSensitiveFragments(rawText.trim()));
    }

    private JsonNode sanitizeNode(JsonNode node) {
        if (node == null || node.isNull()) {
            return JsonNodeFactory.instance.nullNode();
        }

        if (node.isObject()) {
            ObjectNode sanitized = objectMapper.createObjectNode();
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            int index = 0;
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                if (index >= MAX_OBJECT_FIELDS) {
                    sanitized.put("_truncatedFieldCount", Math.max(0, node.size() - MAX_OBJECT_FIELDS));
                    break;
                }

                String fieldName = field.getKey();
                if (isSensitiveField(fieldName)) {
                    sanitized.put(fieldName, REDACTED);
                } else {
                    sanitized.set(fieldName, sanitizeNode(field.getValue()));
                }
                index++;
            }
            return sanitized;
        }

        if (node.isArray()) {
            ArrayNode sanitized = objectMapper.createArrayNode();
            int size = node.size();
            for (int index = 0; index < Math.min(size, MAX_ARRAY_ITEMS); index++) {
                sanitized.add(sanitizeNode(node.get(index)));
            }
            if (size > MAX_ARRAY_ITEMS) {
                sanitized.add("[TRUNCATED_ITEMS:" + (size - MAX_ARRAY_ITEMS) + "]");
            }
            return sanitized;
        }

        if (node.isTextual()) {
            return JsonNodeFactory.instance.textNode(truncateText(redactSensitiveFragments(node.asText())));
        }

        return node.deepCopy();
    }

    private boolean isSensitiveField(String fieldName) {
        if (!StringUtils.hasText(fieldName)) {
            return false;
        }

        String normalized = fieldName.toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
        return normalized.contains("authorization")
                || normalized.contains("token")
                || normalized.contains("signature")
                || normalized.contains("secret")
                || normalized.contains("credential")
                || normalized.contains("accesskey")
                || normalized.contains("policy");
    }

    private String truncateText(String value) {
        if (value == null || value.length() <= MAX_TEXT_LENGTH) {
            return value;
        }

        return value.substring(0, MAX_TEXT_LENGTH) + "...[TRUNCATED len=" + value.length() + "]";
    }

    private String redactSensitiveFragments(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }

        String sanitized = KEY_VALUE_SECRET_PATTERN.matcher(value).replaceAll("$1=[REDACTED]");
        sanitized = BEARER_TOKEN_PATTERN.matcher(sanitized).replaceAll("Bearer " + REDACTED);
        return sanitized;
    }
}
