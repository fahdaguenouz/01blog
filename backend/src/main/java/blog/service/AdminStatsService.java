package blog.service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import blog.dto.DailyStatsDto;
import blog.dto.ReportCategoryCountDto;
import blog.dto.StatsDto;
import blog.dto.TopContributorDto;
import blog.repository.MediaRepository;
import blog.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AdminStatsService {
  private final UserRepository userRepo;
  private final JdbcTemplate jdbc; // optional, only needed for explicit deletes
  private final MediaRepository mediaStorageService; // implement this (S3/local file removal)

 

  public StatsDto getStats() {
    String sql = """
          SELECT
            (SELECT COUNT(*) FROM users) AS total_users,
            (SELECT COUNT(*) FROM posts) AS total_posts,
            (SELECT COUNT(*) FROM reports) AS total_reports,
            (SELECT COUNT(*) FROM categories) AS total_categories,
            (SELECT COUNT(*) FROM reports WHERE status = 'waiting') AS open_reports
        """;

    return jdbc.queryForObject(sql, (rs, rowNum) -> new StatsDto(
        rs.getLong("total_users"),
        rs.getLong("total_posts"),
        rs.getLong("total_reports"),
        rs.getLong("total_categories"),
        rs.getLong("open_reports")));
  }

  public List<DailyStatsDto> getDailyStats(String period) {
    String interval;
    switch (period) {
      case "7d":
        interval = "7";
        break;
      case "6m":
        interval = "180"; // roughly 6 months
        break;
      default:
        interval = "30"; // 30 days by default
    }

    String sql = """
        SELECT d.date,
               COALESCE(u.count, 0) AS users,
               COALESCE(p.count, 0) AS posts,
               COALESCE(r.count, 0) AS reports
        FROM (
            SELECT generate_series(CURRENT_DATE - INTERVAL '%s' DAY, CURRENT_DATE, '1 day')::date AS date
        ) d
        LEFT JOIN (
            SELECT DATE(created_at) AS date, COUNT(*) AS count
            FROM users
            WHERE created_at >= CURRENT_DATE - INTERVAL '%s' DAY
            GROUP BY DATE(created_at)
        ) u ON u.date = d.date
        LEFT JOIN (
            SELECT DATE(created_at) AS date, COUNT(*) AS count
            FROM posts
            WHERE created_at >= CURRENT_DATE - INTERVAL '%s' DAY
            GROUP BY DATE(created_at)
        ) p ON p.date = d.date
        LEFT JOIN (
            SELECT DATE(created_at) AS date, COUNT(*) AS count
            FROM reports
            WHERE created_at >= CURRENT_DATE - INTERVAL '%s' DAY
            GROUP BY DATE(created_at)
        ) r ON r.date = d.date
        ORDER BY d.date
        """
        .formatted(interval, interval, interval, interval);

    return jdbc.query(
        sql,
        (rs, rowNum) -> new DailyStatsDto(
            rs.getDate("date").toLocalDate(),
            rs.getLong("users"),
            rs.getLong("posts"),
            rs.getLong("reports")));
  }

  public List<ReportCategoryCountDto> getReportCategoryStats() {
    String sql = """
        SELECT COALESCE(category, 'Uncategorized') AS category,
               COUNT(*) AS count
        FROM reports
        GROUP BY COALESCE(category, 'Uncategorized')
        ORDER BY count DESC
        """;
    return jdbc.query(sql, (rs, rowNum) -> new ReportCategoryCountDto(
        rs.getString("category"),
        rs.getLong("count")));
  }

  public List<TopContributorDto> getTopContributors(int limit) {
    String sql = """
        SELECT u.id,
               u.username,
               COUNT(p.id) AS posts_count,
               COALESCE(SUM(CASE WHEN p.status = 'flagged' THEN 1 ELSE 0 END), 0) AS flagged_count,
               COALESCE(MAX(p.created_at), u.created_at) AS last_activity
        FROM users u
        LEFT JOIN posts p ON p.user_id = u.id   -- <-- use user_id, not author_id
        GROUP BY u.id, u.username
        ORDER BY posts_count DESC
        LIMIT ?
        """;

    return jdbc.query(
        sql,
        ps -> ps.setInt(1, limit),
        (rs, rowNum) -> new TopContributorDto(
            rs.getObject("id", java.util.UUID.class),
            rs.getString("username"),
            rs.getLong("posts_count"),
            rs.getLong("flagged_count"),
            rs.getTimestamp("last_activity").toInstant()));
  }

  @Transactional
  public void deleteUserAndAllContent(UUID userId) {
    // 1) Ensure user exists
    userRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

    // 2) Delete external media files
    mediaStorageService.deleteByUserId(userId);

    // 3) Delete user from DB (children rows deleted by cascade)
    userRepo.deleteById(userId);
  }

}
