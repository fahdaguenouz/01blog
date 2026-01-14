package blog.mapper;

import blog.dto.*;
import blog.models.Media;
import blog.models.Post;
import blog.repository.MediaRepository;
import blog.repository.PostMediaRepository;

import java.util.List;
import java.util.Objects;

public class PostMapper {

  public static PostDetailDto toDetail(
      Post p,
      MediaRepository mediaRepo,
      PostMediaRepository postMediaRepo,
      List<CategoryDto> categories,
      boolean isLiked,
      boolean isSaved
  ) {

    String avatarUrl = null;
    if (p.getAuthor() != null && p.getAuthor().getAvatarMediaId() != null) {
      avatarUrl = mediaRepo
          .findById(p.getAuthor().getAvatarMediaId())
          .map(Media::getUrl)
          .orElse(null);
    }

    var media = postMediaRepo
        .findByPostIdOrderByPositionAsc(p.getId())
        .stream()
        .map(link -> {
          Media m = mediaRepo.findById(link.getMediaId()).orElse(null);
          if (m == null) return null;

          return new PostMediaDto(
              link.getId(),
              m.getId(),
              m.getUrl(),
              m.getMediaType(),
              link.getDescription(),
              link.getPosition()
          );
        })
        .filter(Objects::nonNull)
        .toList();

    return new PostDetailDto(
        p.getId(),
        p.getTitle(),
        p.getBody(),
        p.getAuthor() != null ? p.getAuthor().getName() : null,
        p.getAuthor() != null ? p.getAuthor().getUsername() : null,
        p.getAuthor() != null ? p.getAuthor().getId() : null,
        avatarUrl,
        p.getLikesCount() != null ? p.getLikesCount() : 0,
        p.getCommentsCount() != null ? p.getCommentsCount() : 0,
        p.getCreatedAt(),
        p.getStatus(),     
        media,
        categories,
        isLiked,
        isSaved
    );
  }
}
