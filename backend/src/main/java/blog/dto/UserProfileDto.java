package blog.dto;

import java.util.UUID;

public class UserProfileDto {
  private UUID id;
  private String username;
  private String name;
  private String email;
  private String bio;
  private Integer age;
  private String avatarUrl;
 private int subscribersCount;  // followers
    private int subscriptionsCount; // following
    private boolean isSubscribed;  // current user follows this profile?
  public UserProfileDto() {}

 public UserProfileDto(UUID id, String username, String name, String email, 
                         String bio, Integer age, String avatarUrl,
                         int subscribersCount, int subscriptionsCount, boolean isSubscribed) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.email = email;
        this.bio = bio;
        this.age = age;
        this.avatarUrl = avatarUrl;
        this.subscribersCount = subscribersCount;
        this.subscriptionsCount = subscriptionsCount;
        this.isSubscribed = isSubscribed;
    }
    public UserProfileDto(UUID id, String username, String name, String email, 
                      String bio, Integer age, String avatarUrl) {
    this(id, username, name, email, bio, age, avatarUrl, 0, 0, false);
}




  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }
  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getBio() { return bio; }
  public void setBio(String bio) { this.bio = bio; }
  public Integer getAge() { return age; }
  public void setAge(Integer age) { this.age = age; }
  public String getAvatarUrl() { return avatarUrl; }
  public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
  public int getSubscribersCount() { return subscribersCount; }
    public void setSubscribersCount(int subscribersCount) { this.subscribersCount = subscribersCount; }
    
    public int getSubscriptionsCount() { return subscriptionsCount; }
    public void setSubscriptionsCount(int subscriptionsCount) { this.subscriptionsCount = subscriptionsCount; }
    
    public boolean isSubscribed() { return isSubscribed; }
    public void setSubscribed(boolean isSubscribed) { this.isSubscribed = isSubscribed; }
}
