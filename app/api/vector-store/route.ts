import { NextRequest, NextResponse } from 'next/server';
import { getVectorStoreService } from '@/lib/ai/services/vector-store-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const vectorStoreService = getVectorStoreService(apiKey);

    switch (action) {
      case 'create':
        const { name, description } = params;
        if (!name) {
          return NextResponse.json(
            { error: 'Vector store name is required' },
            { status: 400 }
          );
        }
        
        const vectorStoreId = await vectorStoreService.createVectorStore({ name, description });
        return NextResponse.json({ success: true, vectorStoreId });

      case 'upload_file':
        const { filePath, purpose, metadata } = params;
        if (!filePath) {
          return NextResponse.json(
            { error: 'File path is required' },
            { status: 400 }
          );
        }
        
        const fileId = await vectorStoreService.uploadFile(filePath, { purpose, metadata });
        return NextResponse.json({ success: true, fileId });

      case 'add_to_store':
        const { vectorStoreId: vsId, fileId: fId } = params;
        if (!vsId || !fId) {
          return NextResponse.json(
            { error: 'Vector store ID and file ID are required' },
            { status: 400 }
          );
        }
        
        await vectorStoreService.addFileToVectorStore(vsId, fId);
        return NextResponse.json({ success: true });

      case 'setup_knowledge_base':
        const { vectorStoreConfig, filePath: fp, fileOptions } = params;
        if (!vectorStoreConfig || !fp) {
          return NextResponse.json(
            { error: 'Vector store config and file path are required' },
            { status: 400 }
          );
        }
        
        const result = await vectorStoreService.setupKnowledgeBase(vectorStoreConfig, fp, fileOptions);
        return NextResponse.json({ success: true, ...result });

      case 'upload_multiple':
        const { vectorStoreId: vsId2, filePaths, fileOptions: fo } = params;
        if (!vsId2 || !filePaths || !Array.isArray(filePaths)) {
          return NextResponse.json(
            { error: 'Vector store ID and file paths array are required' },
            { status: 400 }
          );
        }
        
        const fileIds = await vectorStoreService.uploadMultipleFiles(vsId2, filePaths, fo);
        return NextResponse.json({ success: true, fileIds });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Vector store API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const vectorStoreId = searchParams.get('vectorStoreId');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const vectorStoreService = getVectorStoreService(apiKey);

    switch (action) {
      case 'list_stores':
        const stores = await vectorStoreService.listVectorStores();
        return NextResponse.json({ success: true, stores });

      case 'get_store':
        if (!vectorStoreId) {
          return NextResponse.json(
            { error: 'Vector store ID is required' },
            { status: 400 }
          );
        }
        
        const store = await vectorStoreService.getVectorStore(vectorStoreId);
        return NextResponse.json({ success: true, store });

      case 'list_files':
        if (!vectorStoreId) {
          return NextResponse.json(
            { error: 'Vector store ID is required' },
            { status: 400 }
          );
        }
        
        const files = await vectorStoreService.getVectorStoreFiles(vectorStoreId);
        return NextResponse.json({ success: true, files });

      case 'wait_processing':
        if (!vectorStoreId) {
          return NextResponse.json(
            { error: 'Vector store ID is required' },
            { status: 400 }
          );
        }
        
        const processedFiles = await vectorStoreService.waitForFileProcessing(vectorStoreId);
        return NextResponse.json({ success: true, files: processedFiles });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Vector store API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
} 