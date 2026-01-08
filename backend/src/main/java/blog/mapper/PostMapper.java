package blog.mapper;

import blog.dto.PostDetailDto;
import blog.dto.PostMediaDto;
import blog.dto.PostSummaryDto;
import blog.dto.CategoryDto;
import blog.models.Media;
import blog.models.Post;
import blog.repository.MediaRepository;
import blog.repository.PostMediaRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class PostMapper {

 public static PostSummaryDto toSummary(
    Post p,
    MediaRepository mediaRepo,
    PostMediaRepository postMediaRepo,
    boolean isLiked,
    boolean isSaved
) {
  String avatarUrl = null;
  if (p.getAuthor() != null && p.getAuthor().getAvatarMediaId() != null) {
    avatarUrl = mediaRepo.findById(p.getAuthor().getAvatarMediaId())
        .map(Media::getUrl)
        .orElse(null);
  }

  // take first media (position ASC)
  String firstMediaUrl = null;
  String firstMediaType = null;
  var firstLink = postMediaRepo.findByPostIdOrderByPositionAsc(p.getId()).stream().findFirst();
  if (firstLink.isPresent()) {
    var link = firstLink.get();
    var m = mediaRepo.findById(link.getMediaId()).orElse(null);
    if (m != null) {
      firstMediaUrl = m.getUrl();
      firstMediaType = m.getMediaType();
    }
  }

  int likes = p.getLikesCount() != null ? p.getLikesCount() : 0;
  int comments = p.getCommentsCount() != null ? p.getCommentsCount() : 0;

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
      p.getCreatedAt(),
      firstMediaUrl,
      firstMediaType,
      isLiked,
      isSaved
  );
}
public static PostDetailDto toDetail(
    Post p,
    List<CategoryDto> categories,
    List<PostMediaDto> media,
    boolean isLiked,
    boolean isSaved
) {
  return new PostDetailDto(
      p.getId(),
      p.getTitle(),
      p.getBody(),
      p.getAuthor() != null ? p.getAuthor().getName() : null,
      p.getAuthor() != null ? p.getAuthor().getUsername() : null,
      p.getAuthor() != null ? p.getAuthor().getId() : null,
      p.getLikesCount() != null ? p.getLikesCount() : 0,
      p.getCommentsCount() != null ? p.getCommentsCount() : 0,
      p.getCreatedAt(),
      media,
      categories,
      isLiked,
      isSaved
  );
}


}
