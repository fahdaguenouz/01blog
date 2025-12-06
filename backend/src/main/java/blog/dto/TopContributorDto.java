package blog.dto;

import java.time.Instant;
import java.util.UUID;

public record TopContributorDto(
    UUID id,
    String username,
    long postsCount,
    long flaggedCount,
    Instant lastActivity
) {}
