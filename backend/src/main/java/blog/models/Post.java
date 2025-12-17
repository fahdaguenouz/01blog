// src/main/java/blog/models/Post.java
package blog.models;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
@Data
@Entity
@Table(name = "posts", indexes = {
    @Index(name = "idx_posts_user_created", columnList = "user_id, created_at DESC")
})
public class Post {
  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User author;

  @Column(nullable = false)
  private String title;

  @Column(columnDefinition = "text", nullable = false)
  private String body;

  @Column(nullable = false)
  private String status;

  @Column(name = "likes_count")
  private Integer likesCount;

  @Column(name = "comments_count")
  private Integer commentsCount;

  @Column(name = "impressions_count")
  private Integer impressionsCount;

  @Column(name = "media_url")
  private String mediaUrl;

  @Column(name = "media_type")
  private String mediaType; // "image" or "video"

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null)
      createdAt = Instant.now();
    if (status == null)
      status = "active";
    if (likesCount == null)
      likesCount = 0;
    if (commentsCount == null)
      commentsCount = 0;
    if (impressionsCount == null)
      impressionsCount = 0;
    if (id == null)
      id = UUID.randomUUID();
  }

  // getters/setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public User getAuthor() {
    return author;
  }

  public void setAuthor(User author) {
    this.author = author;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public Integer getLikesCount() {
    return likesCount;
  }

  public void setLikesCount(Integer likesCount) {
    this.likesCount = likesCount;
  }

  public Integer getCommentsCount() {
    return commentsCount;
  }

  public void setCommentsCount(Integer commentsCount) {
    this.commentsCount = commentsCount;
  }

  public Integer getImpressionsCount() {
    return impressionsCount;
  }

  public void setImpressionsCount(Integer impressionsCount) {
    this.impressionsCount = impressionsCount;
  }

  public String getMediaUrl() {
    return mediaUrl;
  }

  public void setMediaUrl(String mediaUrl) {
    this.mediaUrl = mediaUrl;
  }

  public String getMediaType() {
    return mediaType;
  }

  public void setMediaType(String mediaType) {
    this.mediaType = mediaType;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
