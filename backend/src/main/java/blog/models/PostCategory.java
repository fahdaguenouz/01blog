package blog.models;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;
@Entity
@Data
@Table(name = "post_categories",
       uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "category_id"}))
public class PostCategory {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(name = "post_id", nullable = false, columnDefinition = "uuid")
  private UUID postId;

  @Column(name = "category_id", nullable = false, columnDefinition = "uuid")
  private UUID categoryId;

  @PrePersist
  void prePersist() {
    if (id == null) id = UUID.randomUUID();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getPostId() {
    return postId;
  }

  public void setPostId(UUID postId) {
    this.postId = postId;
  }

  public UUID getCategoryId() {
    return categoryId;
  }

  public void setCategoryId(UUID categoryId) {
    this.categoryId = categoryId;
  }
}
