// src/main/java/blog/mapper/PostMapper.java
package blog.mapper;

import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.models.Post;

public class PostMapper {
  public static PostSummaryDto toSummary(Post p) {
    return new PostSummaryDto(
      p.getId(),
      p.getTitle(),
      p.getBody() != null && p.getBody().length() > 160 ? p.getBody().substring(0, 160) + "…" : p.getBody(),
      p.getAuthor() != null ? p.getAuthor().getName() : null,
      p.getAuthor() != null ? p.getAuthor().getUsername() : null,
      p.getAuthor() != null ? p.getAuthor().getId() : null,
      p.getLikesCount() != null ? p.getLikesCount() : 0,
      p.getCommentsCount() != null ? p.getCommentsCount() : 0,
      p.getImpressionsCount() != null ? p.getImpressionsCount() : 0,
      p.getCreatedAt(),
      p.getMediaUrl(),
      p.getMediaType()
    );
  }

  public static PostDetailDto toDetail(Post p) {
    return new PostDetailDto(
      p.getId(),
      p.getTitle(),
      p.getBody(),
      p.getAuthor() != null ? p.getAuthor().getName() : null,
      p.getAuthor() != null ? p.getAuthor().getUsername() : null,
      p.getAuthor() != null ? p.getAuthor().getId() : null,
      p.getLikesCount() != null ? p.getLikesCount() : 0,
      p.getCommentsCount() != null ? p.getCommentsCount() : 0,
      p.getImpressionsCount() != null ? p.getImpressionsCount() : 0,
      p.getCreatedAt(),
      p.getMediaUrl(),
      p.getMediaType()
    );
  }
}
