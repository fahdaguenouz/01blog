package blog.dto;

import java.util.UUID;

public record CreateReportRequest(
    UUID reportedUserId,
    UUID reportedPostId,
    UUID reportedCommentId,
    String category,
    String reason
) {}

