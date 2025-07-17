import { supabase } from '@/lib/supabaseClient';

export interface ImageUploadResult {
  url: string;
  path: string;
  error?: string;
}

export class ImageStorageService {
  private static instance: ImageStorageService;
  
  private constructor() {}
  
  public static getInstance(): ImageStorageService {
    if (!ImageStorageService.instance) {
      ImageStorageService.instance = new ImageStorageService();
    }
    return ImageStorageService.instance;
  }

  /**
   * Upload an image to Supabase storage
   */
  async uploadImage(
    file: File | Blob,
    fileName: string,
    bucket: 'chat-images' | 'user-uploads' | 'generated-content' = 'chat-images'
  ): Promise<ImageUploadResult> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        return { url: '', path: '', error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uniqueFileName);

      return {
        url: urlData.publicUrl,
        path: uniqueFileName
      };
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return { 
        url: '', 
        path: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Convert base64 to blob and upload
   */
  async uploadBase64Image(
    base64Data: string,
    fileName: string,
    bucket: 'chat-images' | 'user-uploads' | 'generated-content' = 'chat-images'
  ): Promise<ImageUploadResult> {
    try {
      // Remove data URL prefix if present
      const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to blob
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      return await this.uploadImage(blob, fileName, bucket);
    } catch (error) {
      console.error('Error in uploadBase64Image:', error);
      return { 
        url: '', 
        path: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(
    path: string,
    bucket: 'chat-images' | 'user-uploads' | 'generated-content' = 'chat-images'
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Error deleting image:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Error in deleteImage:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get public URL for an image
   */
  getPublicUrl(
    path: string,
    bucket: 'chat-images' | 'user-uploads' | 'generated-content' = 'chat-images'
  ): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Check if image exists in storage
   */
  async imageExists(
    path: string,
    bucket: 'chat-images' | 'user-uploads' | 'generated-content' = 'chat-images'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', {
          search: path
        });

      if (error) {
        console.error('Error checking image existence:', error);
        return false;
      }

      return data.some(file => file.name === path);
    } catch (error) {
      console.error('Error in imageExists:', error);
      return false;
    }
  }
}

// Export singleton instance
export const imageStorage = ImageStorageService.getInstance(); 