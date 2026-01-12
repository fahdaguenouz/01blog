package blog.dto;

import java.util.UUID;

public record CommentDto(
        UUID id,
        UUID postId,
        String username,
        String avatarUrl,
        String text,
        String createdAt) {
}
