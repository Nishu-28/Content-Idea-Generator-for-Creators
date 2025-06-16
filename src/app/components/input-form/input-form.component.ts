import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentIdeaService, ContentIdea } from '../../services/content-idea.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-input-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input-form.component.html',
  styleUrls: ['./input-form.component.css']
})
export class InputFormComponent {
  @Output() ideasGenerated = new EventEmitter<ContentIdea[]>();
  
  niche: string = '';
  targetAudience: string = '';
  isLoading: boolean = false;

  constructor(private contentIdeaService: ContentIdeaService) {}

  async onSubmit() {
    if (!this.niche || !this.targetAudience) return;
    
    this.isLoading = true;
    try {
      const ideas = await this.contentIdeaService.generateIdeas(
        this.niche,
        this.targetAudience
      );
      
      if (ideas) {
        this.ideasGenerated.emit(ideas);
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
