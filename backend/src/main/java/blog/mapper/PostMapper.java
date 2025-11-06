// src/main/java/blog/mapper/PostMapper.java
package blog.mapper;

import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.models.Post;

public final class PostMapper {
  private PostMapper() {}

  public static PostSummaryDto toSummary(Post p) {
    String body = p.getBody() == null ? "" : p.getBody();
    String excerpt = body.length() > 200 ? body.substring(0, 200) + "…" : body;
    return new PostSummaryDto(
      p.getId(),
      p.getTitle(),
      excerpt,
      p.getAuthor() != null ? p.getAuthor().getName() : null,
      p.getAuthor() != null ? p.getAuthor().getUsername() : null,
      p.getAuthor() != null ? p.getAuthor().getId() : null,
      p.getLikesCount(),
      p.getCommentsCount(),
      p.getImpressionsCount(),
      p.getCreatedAt()
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
      p.getLikesCount(),
      p.getCommentsCount(),
      p.getImpressionsCount(),
      p.getCreatedAt()
    );
  }
}
