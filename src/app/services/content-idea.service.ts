import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, deleteDoc, doc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ContentIdea {
  id?: string;
  title: string;
  type: 'blog' | 'video' | 'tweet';
  description: string;
  niche: string;
  targetAudience: string;
  isFavorite?: boolean;
  timestamp?: string; // Date when added to favorites
}

@Injectable({
  providedIn: 'root'
})
export class ContentIdeaService {
  private readonly BASE_URL = 'https://generativelanguage.googleapis.com/v1';
  private modelName: string = 'gemini-1.5-flash';

  constructor(private firestore: Firestore, private authService: AuthService) {
    // Initialize by checking available models
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      const response = await fetch(`${this.BASE_URL}/models?key=${environment.geminiApiKey}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      const data = await response.json();
      console.log('Available models:', data);
      
      // Try to find gemini-1.5-flash first, then fall back to any gemini model
      const geminiModel = data.models?.find((model: any) => 
        model.name?.toLowerCase().includes('gemini-1.5-flash')
      ) || data.models?.find((model: any) => 
        model.name?.toLowerCase().includes('gemini')
      );
      
      if (geminiModel) {
        this.modelName = geminiModel.name.split('/').pop();
        console.log('Using model:', this.modelName);
      } else {
        console.error('No Gemini model found in available models');
      }
    } catch (error) {
      console.error('Error initializing model:', error);
    }
  }

  private extractJsonFromMarkdown(text: string): string {
    // Remove markdown code block markers if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    return text.trim();
  }

  async generateIdeas(niche: string, targetAudience: string): Promise<ContentIdea[]> {
    try {
      const prompt = `Generate 20 unique content ideas for a ${niche} creator targeting ${targetAudience}. 
      For each idea, provide:
      1. A catchy title
      2. Content type (blog, video, or tweet)
      3. A brief description
      
      Format each idea as JSON:
      {
        "title": "string",
        "type": "blog|video|tweet",
        "description": "string"
      }
      
      Return an array of 20 ideas.`;

      const response = await fetch(`${this.BASE_URL}/models/${this.modelName}:generateContent?key=${environment.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;

      try {
        // Extract JSON from markdown if present
        const jsonText = this.extractJsonFromMarkdown(text);
        console.log('Extracted JSON:', jsonText);

        // Parse the response and add niche and targetAudience
        const ideas = JSON.parse(jsonText).map((idea: any) => ({
          ...idea,
          niche,
          targetAudience
        }));

        return ideas;
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Raw response:', text);
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      throw error;
    }
  }

  // Save idea to favorites
  async saveToFavorites(idea: ContentIdea): Promise<void> {
    try {
      const user = this.authService.currentUser;
      if (!user) throw new Error('User not logged in');
      const favoritesRef = collection(this.firestore, 'favorites');
      await addDoc(favoritesRef, { 
        ...idea, 
        isFavorite: true,
        timestamp: new Date().toISOString(),
        uid: user.uid
      });
    } catch (error) {
      console.error('Error saving to favorites:', error);
      throw error;
    }
  }

  // Remove from favorites
  async removeFromFavorites(ideaId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'favorites', ideaId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  // Get all favorite ideas
  async getFavorites(): Promise<ContentIdea[]> {
    try {
      const user = this.authService.currentUser;
      if (!user) return [];
      const favoritesRef = collection(this.firestore, 'favorites');
      const q = query(favoritesRef, where('isFavorite', '==', true), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ContentIdea));
    } catch (error) {
      console.error('Error getting favorites:', error);
      throw error;
    }
  }
} 