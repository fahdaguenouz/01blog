// src/main/java/blog/mapper/PostMapper.java
package blog.mapper;

import blog.dto.*;
import blog.models.Media;
import blog.models.Post;
import blog.repository.MediaRepository;
import blog.repository.PostMediaRepository;

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

        String firstMediaUrl = null;
        String firstMediaType = null;

        var firstLink = postMediaRepo
            .findByPostIdOrderByPositionAsc(p.getId())
            .stream()
            .findFirst();

        if (firstLink.isPresent()) {
            UUID mediaId = firstLink.get().getMediaId();
            Media media = mediaRepo.findById(mediaId).orElse(null);
            if (media != null) {
                firstMediaUrl = media.getUrl();
                firstMediaType = media.getMediaType();
            }
        }

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
            firstMediaUrl,
            firstMediaType,
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
