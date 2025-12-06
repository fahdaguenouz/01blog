package blog.service;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import blog.dto.DailyStatsDto;
import blog.dto.StatsDto;


@Service
public class AdminStatsService {
  private final JdbcTemplate jdbc;

  public AdminStatsService(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public StatsDto getStats() {
    String sql = """
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM posts) AS total_posts,
        (SELECT COUNT(*) FROM reports) AS total_reports,
        (SELECT COUNT(*) FROM categories) AS total_categories,
        (SELECT COUNT(*) FROM reports WHERE status = 'waiting') AS open_reports
    """;

    return jdbc.queryForObject(sql, (rs, rowNum) ->
      new StatsDto(
        rs.getLong("total_users"),
        rs.getLong("total_posts"),
        rs.getLong("total_reports"),
        rs.getLong("total_categories"),
        rs.getLong("open_reports")
      )
    );
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

    String sql =
        """
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
        (rs, rowNum) ->
            new DailyStatsDto(
                rs.getDate("date").toLocalDate(),
                rs.getLong("users"),
                rs.getLong("posts"),
                rs.getLong("reports")));
  }
}
