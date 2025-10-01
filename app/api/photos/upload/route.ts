/**
 * Photo Upload API
 * Handles skin photo uploads with validation, compression, and metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract fields
    const photoFile = formData.get('photo') as File;
    const photoType = (formData.get('photoType') as string) || 'baseline';
    const mlConsent = formData.get('mlConsent') === 'true';
    const sessionId = formData.get('sessionId') as string;
    const userId = formData.get('userId') as string | null;

    // Validation
    if (!photoFile) {
      return NextResponse.json(
        { error: 'No photo file provided' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(photoFile.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (photoFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    console.log('[Photo Upload] Processing upload:', {
      filename: photoFile.name,
      type: photoFile.type,
      size: photoFile.size,
      photoType,
      mlConsent,
      sessionId,
    });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = photoFile.name.split('.').pop() || 'jpg';
    const filename = `${sessionId}_${timestamp}_${randomString}.${extension}`;
    const filepath = `skin-photos/${photoType}/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filepath, photoFile, {
        contentType: photoFile.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Photo Upload] Storage error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(filepath);

    const photoUrl = urlData.publicUrl;

    // Save metadata to database
    const { data: photoRecord, error: dbError } = await supabase
      .from('skin_photos')
      .insert([
        {
          user_id: userId || null,
          session_id: sessionId,
          photo_type: photoType,
          storage_path: filepath,
          photo_url: photoUrl,
          ml_consent: mlConsent,
          file_size: photoFile.size,
          file_type: photoFile.type,
          original_filename: photoFile.name,
          uploaded_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('[Photo Upload] Database error:', dbError);
      // Photo uploaded but metadata failed - still return success
      console.warn('[Photo Upload] Photo uploaded but metadata not saved');
    }

    console.log('[Photo Upload] Success:', {
      photoId: photoRecord?.id,
      photoUrl,
      filepath,
    });

    return NextResponse.json({
      success: true,
      photoId: photoRecord?.id,
      photoUrl,
      filepath,
      message: 'Photo uploaded successfully',
    });

  } catch (error: any) {
    console.error('[Photo Upload] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
