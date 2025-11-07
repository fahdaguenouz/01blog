package blog.dto;

public record RegisterRequest(
  String name,
  String username,
  String email,
  String password,
  Integer age,
  String bio // optional
) {}
