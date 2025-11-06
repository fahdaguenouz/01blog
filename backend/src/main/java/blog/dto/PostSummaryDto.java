// src/main/java/blog/dto/PostSummaryDto.java
package blog.dto;

import java.time.Instant;
import java.util.UUID;

public record PostSummaryDto(
  UUID id,
  String title,
  String excerpt,
  String authorName,
  String authorUsername,
  UUID authorId,
  Integer likes,
  Integer comments,
  Integer impressions,
  Instant createdAt
) {}
