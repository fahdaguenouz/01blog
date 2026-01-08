package blog.dto;

import java.util.UUID;

public record PostMediaDto(
    UUID id,           // post_media.id (link row id)
    UUID mediaId,      // media.id
    String url,        // media.url
    String mediaType,  // media.media_type
    String description,
    Integer position
) {}