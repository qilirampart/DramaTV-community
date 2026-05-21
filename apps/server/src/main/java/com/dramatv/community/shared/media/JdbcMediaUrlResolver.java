package com.dramatv.community.shared.media;

import java.sql.ResultSet;
import java.sql.SQLException;
import org.springframework.stereotype.Component;

@Component
public class JdbcMediaUrlResolver {

    private final MediaAssetUrlResolver mediaAssetUrlResolver;

    public JdbcMediaUrlResolver(MediaAssetUrlResolver mediaAssetUrlResolver) {
        this.mediaAssetUrlResolver = mediaAssetUrlResolver;
    }

    public String resolve(ResultSet resultSet, String columnName) throws SQLException {
        String storedReference = nullableText(resultSet, columnName);
        if (storedReference == null) {
            return null;
        }

        String baseColumn = columnName.endsWith("_url")
                ? columnName.substring(0, columnName.length() - 4)
                : columnName;

        return mediaAssetUrlResolver.resolve(
                nullableTextIfPresent(resultSet, baseColumn + "_storage_provider"),
                nullableTextIfPresent(resultSet, baseColumn + "_bucket_name"),
                storedReference
        );
    }

    public String resolveReference(String storedReference) {
        return mediaAssetUrlResolver.resolve(storedReference);
    }

    public String resolveReference(ResultSet resultSet, String columnName) throws SQLException {
        return resolveReference(nullableText(resultSet, columnName));
    }

    public String nullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    public String nullableTextIfPresent(ResultSet resultSet, String columnName) throws SQLException {
        try {
            resultSet.findColumn(columnName);
        } catch (SQLException ex) {
            return null;
        }

        return nullableText(resultSet, columnName);
    }
}
