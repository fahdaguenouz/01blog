package blog.dto;

import blog.models.User;

public class AuthResponse {
  private String token;
  private User user;
  private String role;

  // Updated constructor
  public AuthResponse(String token, User user, String role) {
    this.token = token;
    this.user = user;
    this.role = role;
  }

  // Existing constructor
  public AuthResponse(String token, User user) {
    this(token, user, user.getRole().name());
  }

  // Getters/Setters
  public String getToken() {
    return token;
  }

  public void setToken(String token) {
    this.token = token;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public String getRole() {
    return role;
  }

  public void setRole(String role) {
    this.role = role;
  }
}
