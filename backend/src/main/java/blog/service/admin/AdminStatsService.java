
package blog.service.admin;

import blog.dto.DailyStatsDto;
import blog.dto.ReportCategoryCountDto;
import blog.dto.StatsDto;
import blog.dto.TopContributorDto;
import blog.repository.AdminStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStatsService {

  private final AdminStatsRepository repo;

  public StatsDto getStats() {
    return repo.fetchStats();
  }

  public List<DailyStatsDto> getDailyStats(String period) {
    int days = switch (period) {
      case "7d" -> 7;
      case "6m" -> 180;
      default -> 30;
    };
    return repo.fetchDailyStats(days);
  }

  public List<ReportCategoryCountDto> getReportCategoryStats() {
    return repo.fetchReportCategoryStats();
  }

  public List<TopContributorDto> getTopContributors(int limit) {
    int safeLimit = Math.max(1, Math.min(limit, 100)); // avoid abuse
    return repo.fetchTopContributors(safeLimit);
  }
}
