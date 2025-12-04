package blog.dto;

import java.time.LocalDate;

public class DailyStatsDto {
    private LocalDate date;
    private long users;
    private long posts;
    private long reports;

    // Constructor with fields
    public DailyStatsDto(LocalDate date, long users, long posts, long reports) {
        this.date = date;
        this.users = users;
        this.posts = posts;
        this.reports = reports;
    }

    // Getters
    public LocalDate getDate() { return date; }
    public long getUsers() { return users; }
    public long getPosts() { return posts; }
    public long getReports() { return reports; }

    // Optional: setters if needed
    public void setDate(LocalDate date) { this.date = date; }
    public void setUsers(long users) { this.users = users; }
    public void setPosts(long posts) { this.posts = posts; }
    public void setReports(long reports) { this.reports = reports; }
}
