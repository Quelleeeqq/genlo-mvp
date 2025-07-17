import OpenAI from 'openai';

export interface VectorStoreConfig {
  name: string;
  description?: string;
}

export interface FileUploadOptions {
  purpose?: 'assistants' | 'fine-tune' | 'batch';
  metadata?: Record<string, any>;
}

export interface VectorStoreFile {
  id: string;
  filename: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  created_at: number;
  metadata?: Record<string, any>;
}

export class VectorStoreService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Create a new vector store
   */
  async createVectorStore(config: VectorStoreConfig): Promise<string> {
    try {
      const vectorStore = await this.client.vectorStores.create({
        name: config.name
      });
      
      console.log(`Created vector store: ${vectorStore.id}`);
      return vectorStore.id;
    } catch (error) {
      console.error('Error creating vector store:', error);
      throw error;
    }
  }

  /**
   * Upload a file to OpenAI
   */
  async uploadFile(filePath: string, options: FileUploadOptions = {}): Promise<string> {
    try {
      let result;
      
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Download the file content from the URL
        const response = await fetch(filePath);
        const buffer = await response.arrayBuffer();
        const urlParts = filePath.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const file = new File([buffer], fileName);
        
        result = await this.client.files.create({
          file: file,
          purpose: options.purpose || 'assistants'
        });
      } else {
        // Handle local file path
        const fs = require('fs');
        const fileContent = fs.createReadStream(filePath);
        
        result = await this.client.files.create({
          file: fileContent,
          purpose: options.purpose || 'assistants'
        });
      }
      
      console.log(`Uploaded file: ${result.id}`);
      return result.id;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Add a file to a vector store
   */
  async addFileToVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
    try {
      await this.client.vectorStores.files.create(vectorStoreId, {
        file_id: fileId
      });
      
      console.log(`Added file ${fileId} to vector store ${vectorStoreId}`);
    } catch (error) {
      console.error('Error adding file to vector store:', error);
      throw error;
    }
  }

  /**
   * Check the status of files in a vector store
   */
  async getVectorStoreFiles(vectorStoreId: string): Promise<VectorStoreFile[]> {
    try {
      const result = await this.client.vectorStores.files.list(vectorStoreId);
      
      return result.data.map(file => ({
        id: file.id,
        filename: 'Unknown', // OpenAI API doesn't expose filename in this context
        status: file.status,
        created_at: file.created_at
      }));
    } catch (error) {
      console.error('Error getting vector store files:', error);
      throw error;
    }
  }

  /**
   * Wait for files to be processed
   */
  async waitForFileProcessing(vectorStoreId: string, timeoutMs: number = 300000): Promise<VectorStoreFile[]> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const files = await this.getVectorStoreFiles(vectorStoreId);
      const allCompleted = files.every(file => file.status === 'completed');
      
      if (allCompleted) {
        console.log('All files processed successfully');
        return files;
      }
      
      const processingFiles = files.filter(file => file.status === 'in_progress');
      console.log(`Waiting for ${processingFiles.length} files to complete processing...`);
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('File processing timeout');
  }

  /**
   * Delete a file from a vector store
   */
  async deleteFileFromVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
    try {
      await this.client.vectorStores.files.delete(fileId, { vector_store_id: vectorStoreId });
      console.log(`Deleted file ${fileId} from vector store ${vectorStoreId}`);
    } catch (error) {
      console.error('Error deleting file from vector store:', error);
      throw error;
    }
  }

  /**
   * Delete a vector store
   */
  async deleteVectorStore(vectorStoreId: string): Promise<void> {
    try {
      await this.client.vectorStores.delete(vectorStoreId);
      console.log(`Deleted vector store: ${vectorStoreId}`);
    } catch (error) {
      console.error('Error deleting vector store:', error);
      throw error;
    }
  }

  /**
   * List all vector stores
   */
  async listVectorStores(): Promise<any[]> {
    try {
      const result = await this.client.vectorStores.list();
      return result.data;
    } catch (error) {
      console.error('Error listing vector stores:', error);
      throw error;
    }
  }

  /**
   * Get vector store details
   */
  async getVectorStore(vectorStoreId: string): Promise<any> {
    try {
      return await this.client.vectorStores.retrieve(vectorStoreId);
    } catch (error) {
      console.error('Error getting vector store:', error);
      throw error;
    }
  }

  /**
   * Complete workflow: Create vector store, upload file, and add to store
   */
  async setupKnowledgeBase(
    vectorStoreConfig: VectorStoreConfig,
    filePath: string,
    fileOptions: FileUploadOptions = {}
  ): Promise<{ vectorStoreId: string; fileId: string }> {
    try {
      // Create vector store
      const vectorStoreId = await this.createVectorStore(vectorStoreConfig);
      
      // Upload file
      const fileId = await this.uploadFile(filePath, fileOptions);
      
      // Add file to vector store
      await this.addFileToVectorStore(vectorStoreId, fileId);
      
      // Wait for processing
      await this.waitForFileProcessing(vectorStoreId);
      
      return { vectorStoreId, fileId };
    } catch (error) {
      console.error('Error setting up knowledge base:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files to a vector store
   */
  async uploadMultipleFiles(
    vectorStoreId: string,
    filePaths: string[],
    fileOptions: FileUploadOptions = {}
  ): Promise<string[]> {
    try {
      const fileIds: string[] = [];
      
      for (const filePath of filePaths) {
        const fileId = await this.uploadFile(filePath, fileOptions);
        await this.addFileToVectorStore(vectorStoreId, fileId);
        fileIds.push(fileId);
      }
      
      // Wait for all files to be processed
      await this.waitForFileProcessing(vectorStoreId);
      
      return fileIds;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }
}

// Export a singleton instance
let vectorStoreService: VectorStoreService | null = null;

export function getVectorStoreService(apiKey?: string): VectorStoreService {
  if (!vectorStoreService) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required for vector store service');
    }
    vectorStoreService = new VectorStoreService(apiKey);
  }
  return vectorStoreService;
} 