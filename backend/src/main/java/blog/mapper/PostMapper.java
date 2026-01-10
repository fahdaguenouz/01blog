// src/main/java/blog/mapper/PostMapper.java
package blog.mapper;

import blog.dto.*;
import blog.models.Media;
import blog.models.Post;
import blog.repository.MediaRepository;
import blog.repository.PostMediaRepository;

import java.util.Objects;
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
        avatarUrl = mediaRepo
            .findById(p.getAuthor().getAvatarMediaId())
            .map(Media::getUrl)
            .orElse(null);
    }

    // ✅ FULL MEDIA LIST (same logic as detail)
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

    return new PostSummaryDto(
        p.getId(),
        p.getTitle(),
        p.getBody() != null && p.getBody().length() > 160
            ? p.getBody().substring(0, 160) + "…"
            : p.getBody(),
        p.getAuthor() != null ? p.getAuthor().getName() : null,
        avatarUrl,
        p.getAuthor() != null ? p.getAuthor().getUsername() : null,
        p.getAuthor() != null ? p.getAuthor().getId() : null,
        p.getLikesCount() != null ? p.getLikesCount() : 0,
        p.getCommentsCount() != null ? p.getCommentsCount() : 0,
        p.getCreatedAt(),
        media,          
        isLiked,
        isSaved
    );
}

    public static PostDetailDto toDetail(
        Post p,
        java.util.List<CategoryDto> categories,
        java.util.List<PostMediaDto> media,
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
