// src/main/java/blog/controller/CategoryController.java
package blog.controller;

import blog.dto.CategoryDto;
import blog.models.Category;
import blog.repository.CategoryRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

  private final CategoryRepository categories;

  public CategoryController(CategoryRepository categories) {
    this.categories = categories;
  }

  @GetMapping
  public List<CategoryDto> list() {
    return categories.findAll().stream()
        .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
        .toList();
  }
}
