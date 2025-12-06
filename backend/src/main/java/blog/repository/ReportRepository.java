// src/main/java/blog/repository/ReportRepository.java
package blog.repository;

import blog.models.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
}
