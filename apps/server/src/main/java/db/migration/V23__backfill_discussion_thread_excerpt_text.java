package db.migration;

import com.dramatv.community.shared.support.RichTextExcerptSupport;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V23__backfill_discussion_thread_excerpt_text extends BaseJavaMigration {

    private static final int EXCERPT_LIMIT = 140;

    @Override
    public void migrate(Context context) throws Exception {
        try (
                PreparedStatement select = context.getConnection().prepareStatement("""
                        select id, content_text
                        from discussion_threads
                        """);
                ResultSet resultSet = select.executeQuery();
                PreparedStatement update = context.getConnection().prepareStatement("""
                        update discussion_threads
                        set excerpt_text = ?
                        where id = ?
                        """)
        ) {
            while (resultSet.next()) {
                update.setString(1, RichTextExcerptSupport.toExcerpt(resultSet.getString("content_text"), EXCERPT_LIMIT));
                update.setObject(2, resultSet.getObject("id"));
                update.addBatch();
            }

            update.executeBatch();
        }
    }
}
