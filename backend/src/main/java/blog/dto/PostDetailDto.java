// src/main/java/blog/dto/PostDetailDto.java
package blog.dto;

import java.time.Instant;
import java.util.UUID;

public record PostDetailDto(
  UUID id,
  String title,
  String body,
  String authorName,
  String authorUsername,
  UUID authorId,
  int likes,
  int comments,
  int impressions,
  Instant createdAt,
  String mediaUrl,
  String mediaType
) {}
