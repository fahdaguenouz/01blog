package blog.dto;

public record StatsDto(
    long totalUsers,
    long totalPosts,
    long totalReports,
    long totalCategories,
    long openReports
) {}
