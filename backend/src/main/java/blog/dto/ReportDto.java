package blog.dto;

import java.time.Instant;
import java.util.UUID;

public record ReportDto(
    UUID id,
    UUID reporterId,
    UUID reportedUserId,
    UUID reportedPostId,
    UUID reportedCommentId,
    String category,
    String reason,
    String status,
    Instant createdAt
) {}