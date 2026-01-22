package blog.repository;

import blog.models.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {

    // Delete all reports for a specific post
    @Transactional
    void deleteByReportedPostId(UUID reportedPostId);

    List<Report> findByReportedPostId(UUID reportedPostId);
}
