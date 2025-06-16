import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-export-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-buttons.component.html',
  styleUrls: ['./export-buttons.component.css']
})
export class ExportButtonsComponent {
  exportToNotion() {
    // Will implement later
    console.log('Exporting to Notion');
  }

  exportToGoogleDocs() {
    // Will implement later
    console.log('Exporting to Google Docs');
  }
}
