import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

const BUCKET_NAME = 'dxf-files';

/**
 * GET /api/file?key=path/to/file
 * Downloads a file from Supabase Storage
 * Requires authentication: user must own the file or be an admin
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const key = searchParams.get('key');

	if (!key) {
		return NextResponse.json(
			{ error: 'Missing required parameter: key' },
			{ status: 400 }
		);
	}

	try {
		// Authenticate user
		const supabaseAuth = await createClient();
		const {
			data: { user },
		} = await supabaseAuth.auth.getUser();

		if (!user) {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			);
		}

		// Check ownership: storage path starts with userId/
		const fileOwnerId = key.split('/')[0];
		if (fileOwnerId !== user.id) {
			// Check if user is admin
			const dbUser = await prisma.user.findUnique({
				where: { id: user.id },
				select: { role: true },
			});

			if (!dbUser || dbUser.role !== 'ADMIN') {
				return NextResponse.json(
					{ error: 'Forbidden' },
					{ status: 403 }
				);
			}
		}

		const supabase = createAdminClient();

		// Download file from Supabase Storage
		const { data, error } = await supabase.storage
			.from(BUCKET_NAME)
			.download(key);

		if (error) {
			console.error('Supabase Storage download error:', error);
			return NextResponse.json(
				{ error: error.message || 'Failed to download file' },
				{ status: 404 }
			);
		}

		if (!data) {
			return NextResponse.json(
				{ error: 'File not found' },
				{ status: 404 }
			);
		}

		// Convert Blob to Uint8Array for response
		const arrayBuffer = await data.arrayBuffer();

		// Determine content type from file extension or default to DXF
		const contentType = key.endsWith('.dxf')
			? 'application/dxf'
			: 'application/octet-stream';

		return new NextResponse(new Uint8Array(arrayBuffer), {
			status: 200,
			headers: {
				'Content-Type': contentType,
			},
		});
	} catch (error: any) {
		console.error('Error downloading file:', error);
		return NextResponse.json(
			{ error: error.message || 'Internal server error' },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/file
 * Uploads a file to Supabase Storage
 *
 * Body: { fileName: string, fileContent: string (base64), contentType?: string }
 */
export async function POST(request: Request) {
	try {
		// Get authenticated user from session cookies
		const supabaseAuth = await createClient();
		const {
			data: { user },
		} = await supabaseAuth.auth.getUser();

		if (!user) {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { fileName, fileContent, contentType } = body;

		if (!fileName || !fileContent) {
			return NextResponse.json(
				{ error: 'Fields fileName and fileContent are required.' },
				{ status: 400 }
			);
		}

		// Build storage path: {userId}/{fileName}
		const storagePath = `${user.id}/${fileName}`;

		// Convert base64 content to Buffer
		const fileBuffer = Buffer.from(fileContent, 'base64');

		const supabaseAdmin = createAdminClient();

		// Upload to Supabase Storage
		const { data, error } = await supabaseAdmin.storage
			.from(BUCKET_NAME)
			.upload(storagePath, fileBuffer, {
				contentType: contentType || 'application/octet-stream',
				upsert: false,
			});

		if (error) {
			console.error('Supabase Storage upload error:', error);
			return NextResponse.json(
				{ error: error.message || 'Failed to upload file' },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{
				message: 'File uploaded successfully',
				path: data.path,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		console.error('Error uploading file:', error);
		return NextResponse.json(
			{ error: error.message || 'Internal server error' },
			{ status: 500 }
		);
	}
}
