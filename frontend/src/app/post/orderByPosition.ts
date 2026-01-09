import { Pipe, PipeTransform } from '@angular/core';
import { PostMedia } from '../services/post.service';

@Pipe({ name: 'orderByPosition', standalone: true })
export class OrderByPositionPipe implements PipeTransform {
 transform(media: PostMedia[] | undefined): PostMedia[] {
  return media ? [...media].sort((a, b) => a.position - b.position) : [];
}

}
