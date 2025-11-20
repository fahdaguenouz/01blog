// src/main/java/blog/dto/CategoryDto.java
package blog.dto;

import java.util.UUID;

public record CategoryDto(UUID id, String name, String slug) {}
