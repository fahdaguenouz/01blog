package blog.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

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
}
