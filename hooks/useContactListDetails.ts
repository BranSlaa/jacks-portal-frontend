import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { ContactList } from '@/app/types/contactLists';
import { Contact } from '@/app/types/contacts';

export function useContactListDetails(contactListId: string) {
  const [contactList, setContactList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [clientName, setClientName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const { showError, showSuccess } = useNotifications();

  const fetchContactListDetails = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch contact list data
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('id', contactListId)
        .single();

      if (error) throw error;
      if (!data) {
        showError('Contact list not found');
        router.push('/email/contact-lists');
        return;
      }

      // Fetch client name
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('name')
        .eq('id', data.client_id)
        .single();

      if (!clientError && clientData) {
        setClientName(clientData.name);
      }

      // Fetch contacts in this list
      const { data: contactData, error: contactError } = await supabase
        .from('contact_list_contacts')
        .select('contact_id')
        .eq('contact_list_id', contactListId);

      if (contactError) {
        console.error('Error fetching contacts:', contactError);
      } else if (contactData && contactData.length > 0) {
        const contactIds = contactData.map(item => item.contact_id);
        
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('*, clients(name)')
          .in('id', contactIds);

        if (!contactsError && contactsData) {
          const formattedContacts = contactsData.map(contact => ({
            ...contact,
            client_name: contact.clients?.name || 'Unknown'
          }));
          setContacts(formattedContacts);
        }
      } else {
        setContacts([]);
      }

      setContactList(data);
      showSuccess('Contact list details loaded');
    } catch (error: any) {
      console.error('Error fetching contact list details:', error);
      showError(`Failed to load contact list: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [contactListId, router, showError, showSuccess, supabase]);

  useEffect(() => {
    fetchContactListDetails();
  }, [fetchContactListDetails]);

  return { 
    contactList, 
    contacts, 
    clientName, 
    loading,
    refreshData: fetchContactListDetails
  };
} 