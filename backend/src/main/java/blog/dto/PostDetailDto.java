// src/main/java/blog/dto/PostDetailDto.java
package blog.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PostDetailDto(
    UUID id,
    String title,
    String body,
    String authorName,
    String authorUsername,
    UUID authorId,
    String avatarUrl,
    int likes,
    int comments,
    Instant createdAt,
    String status,
    List<PostMediaDto> media,
    List<CategoryDto> categories,
    boolean isLiked,
    boolean isSaved) {
}
