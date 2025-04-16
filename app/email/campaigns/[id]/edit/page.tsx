'use client';

import { useParams } from 'next/navigation';
import CampaignForm from '@/components/email/campaign/CampaignForm';

export default function CampaignEditPage() {
	const params = useParams();
	const id = params?.id as string;

	return <CampaignForm campaignId={id} isEdit={true} />;
}
