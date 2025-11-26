package blog.mapper;

import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.dto.CategoryDto;
import blog.models.Media;
import blog.models.Post;
import blog.repository.MediaRepository;

import java.util.List;
import java.util.Optional;

public class PostMapper {

  public static PostSummaryDto toSummary(Post p, MediaRepository mediaRepo, boolean isLiked, boolean isSaved) {
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
    (p.getBody() != null && p.getBody().length() > 160)
        ? p.getBody().substring(0, 160) + "…" : p.getBody(),
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
    isLiked,
    isSaved
  );
}


 public static PostDetailDto toDetail(Post p, List<CategoryDto> categories, boolean isLiked, boolean isSaved) {
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
    p.getMediaType(),
    categories,
    isLiked,
    isSaved
  );
}

}
