// src/main/java/blog/dto/PostSummaryDto.java
package blog.dto;

import java.time.Instant;
import java.util.UUID;

public record PostSummaryDto(
  UUID id,
  String title,
  String excerpt,
  String authorName,
  String avatarUrl,
  String authorUsername,
  UUID authorId,
  int likes,
  int comments,
  int impressions,
  Instant createdAt,
  String mediaUrl,
  String mediaType,
  boolean isLiked
){}
