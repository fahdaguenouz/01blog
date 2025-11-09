package blog.mapper;

import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.models.Media;
import blog.models.Post;
import blog.repository.MediaRepository;

import java.util.Optional;

public class PostMapper {

  /**
   * Map a Post entity to PostSummaryDto including avatarUrl resolved from MediaRepository,
   * and include if the current user liked the post.
   */
public static PostSummaryDto toSummary(Post p, MediaRepository mediaRepo, boolean isLiked) {
  String avatarUrl = null;
  if (p.getAuthor() != null && p.getAuthor().getAvatarMediaId() != null) {
    Optional<Media> mediaOpt = mediaRepo.findById(p.getAuthor().getAvatarMediaId());
    if (mediaOpt.isPresent()) {
      avatarUrl = mediaOpt.get().getUrl();
    }
  }

  int likes = (p.getLikesCount() != null) ? p.getLikesCount() : 0;
  int comments = (p.getCommentsCount() != null) ? p.getCommentsCount() : 0;
  int impressions = (p.getImpressionsCount() != null) ? p.getImpressionsCount() : 0;

  return new PostSummaryDto(
    p.getId(),
    p.getTitle(),
    (p.getBody() != null && p.getBody().length() > 160) ? p.getBody().substring(0, 160) + "…" : p.getBody(),
    p.getAuthor() != null ? p.getAuthor().getName() : null,
    avatarUrl,
    p.getAuthor() != null ? p.getAuthor().getUsername() : null,
    p.getAuthor() != null ? p.getAuthor().getId() : null,
    likes,
    comments,
    impressions,
    p.getCreatedAt(),
    p.getMediaUrl(),
    p.getMediaType(),
    isLiked
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
