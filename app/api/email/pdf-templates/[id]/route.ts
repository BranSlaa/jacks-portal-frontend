import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
	) {
	const supabase = await createClient();
	const id = parseInt(params.id);

	if (isNaN(id)) {
		return NextResponse.json(
		{ error: 'Invalid ID format' },
		{ status: 400 }
		);
	}

	const { error } = await supabase
		.from('pdf_templates')
		.delete()
		.eq('id', id);

	if (error) {
		return NextResponse.json(
		{ error: error.message },
		{ status: 500 }
		);
	}

	return NextResponse.json({ success: true });
} 