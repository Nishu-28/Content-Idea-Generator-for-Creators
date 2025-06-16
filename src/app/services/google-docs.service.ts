import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

const CLIENT_ID = environment.googleClientId;
const DISCOVERY_DOCS = [
  'https://docs.googleapis.com/$discovery/rest?version=v1'
];
const SCOPES = 'https://www.googleapis.com/auth/documents';

@Injectable({ providedIn: 'root' })
export class GoogleDocsService {
  private gapiLoaded = false;
  private gisInited = false;
  private tokenClient: any = null;
  private accessToken: string | null = null;

  async loadGapi(): Promise<void> {
    if (this.gapiLoaded) { console.log('gapi already loaded'); return; }
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if ((window as any).gapi) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
    console.log('gapi found, loading client...');
    await (window as any).gapi.load('client', async () => {
      await (window as any).gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
      });
      this.gapiLoaded = true;
      console.log('gapi client loaded');
    });
  }

  async initGis(): Promise<void> {
    if (this.gisInited) { console.log('GIS already inited'); return; }
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.oauth2) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
    console.log('GIS found, initializing token client...');
    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        this.accessToken = tokenResponse.access_token;
        console.log('GIS token callback, access token:', this.accessToken);
      }
    });
    this.gisInited = true;
    console.log('GIS token client initialized');
  }

  async signIn(): Promise<void> {
    console.log('signIn called');
    await this.loadGapi();
    await this.initGis();
    if (!this.accessToken) {
      console.log('Requesting access token...');
      await new Promise<void>((resolve, reject) => {
        this.tokenClient.callback = (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            this.accessToken = tokenResponse.access_token;
            console.log('Received access token:', this.accessToken);
            resolve();
          } else {
            console.error('Failed to get access token', tokenResponse);
            reject('Failed to get access token');
          }
        };
        this.tokenClient.requestAccessToken();
      });
    }
    // Set the access token for gapi
    (window as any).gapi.client.setToken({ access_token: this.accessToken });
    console.log('gapi client set with access token');
  }

  async exportToGoogleDoc(title: string, content: string[]): Promise<string> {
    console.log('exportToGoogleDoc called', title, content);
    await this.signIn();
    const gapi = (window as any).gapi;
    // Create a new document
    const doc = await gapi.client.docs.documents.create({ title });
    const documentId = doc.result.documentId;
    console.log('Created Google Doc:', documentId);
    // Insert all content at once at index 1
    const requests = [
      {
        insertText: {
          location: { index: 1 },
          text: content.join('\n\n')
        }
      }
    ];
    // Batch update the document
    await gapi.client.docs.documents.batchUpdate({
      documentId,
      requests
    });
    console.log('Batch update complete');
    return `https://docs.google.com/document/d/${documentId}/edit`;
  }
} 