package com.dramatv.community.publish.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublishDraftRepository extends JpaRepository<PublishDraftEntity, UUID> {

    Optional<PublishDraftEntity> findByIdAndDraftType(UUID id, String draftType);

    Optional<PublishDraftEntity> findByIdAndDraftTypeAndAuthorId(UUID id, String draftType, UUID authorId);

    Optional<PublishDraftEntity> findTopByAuthorIdAndDraftTypeAndStatusCodeOrderByUpdatedAtDesc(
            UUID authorId,
            String draftType,
            String statusCode
    );
}
