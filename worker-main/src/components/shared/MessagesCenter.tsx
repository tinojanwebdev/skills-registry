import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Plus, Search, Send } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/Modal';
import { dbService } from '../../services/database.service';
import { ConversationWithDetails, Message } from '../../types/database';

interface MessagesCenterProps {
  role: 'buyer' | 'seller';
}

interface ContactItem {
  userId: number;
  name: string;
  image?: string;
  subtitle?: string;
}

export function MessagesCenter({ role }: MessagesCenterProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [conversationSearch, setConversationSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');

  const userId = Number.parseInt(localStorage.getItem('user_id') || '0', 10);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await dbService.getConversations(userId);
      setConversations(data);
      if (!selectedChatId && data.length > 0) {
        setSelectedChatId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (!Number.isInteger(userId) || userId <= 0) return;
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const data = await dbService.getMessages(selectedChatId);
        setMessages(data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedChatId]);

  useEffect(() => {
    if (!Number.isInteger(userId) || userId <= 0) return;

    const interval = window.setInterval(async () => {
      await loadConversations();
      if (selectedChatId) {
        try {
          const data = await dbService.getMessages(selectedChatId);
          setMessages(data);
        } catch (error) {
          console.error('Failed to poll messages:', error);
        }
      }
    }, 5000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId, userId]);

  const conversationRows = useMemo(
    () =>
      conversations.map((chat) => {
        const participant =
          role === 'buyer'
            ? {
                name: chat.seller?.full_name || 'Seller',
                image: chat.seller?.profile_image,
                subtitle: 'Seller',
              }
            : {
                name: chat.buyer?.full_name || 'Client',
                image: chat.buyer?.profile_image,
                subtitle: 'Client',
              };

        return {
          id: chat.id,
          participant,
          lastMessage: chat.last_message?.message_text || 'No messages yet',
          unread: chat.unread_count || 0,
        };
      }),
    [conversations, role]
  );

  const filteredConversationRows = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return conversationRows;
    return conversationRows.filter((row) => {
      const haystack = `${row.participant.name} ${row.participant.subtitle || ''} ${row.lastMessage}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [conversationRows, conversationSearch]);

  const selectedConversation = conversationRows.find((c) => c.id === selectedChatId) || null;
  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) =>
      `${contact.name} ${contact.subtitle || ''}`.toLowerCase().includes(query)
    );
  }, [contacts, contactSearch]);

  const openContacts = async () => {
    try {
      setContactLoading(true);
      setIsContactModalOpen(true);
      const data = await dbService.getMessageContacts(role);
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setContacts([]);
    } finally {
      setContactLoading(false);
    }
  };

  const startConversation = async (contact: ContactItem) => {
    try {
      const conversation = await dbService.getOrCreateConversation(contact.userId);
      await loadConversations();
      setSelectedChatId(conversation.id);
      setIsContactModalOpen(false);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const sendCurrentMessage = async () => {
    if (!selectedChatId || !draft.trim()) return;
    try {
      const created = await dbService.sendMessage({
        conversation_id: selectedChatId,
        sender_id: userId,
        message_text: draft.trim(),
        message_type: 'text',
      });
      setMessages((prev) => [...prev, created]);
      setDraft('');
      await loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] gap-4">
          <Card className="p-3 h-[calc(100vh-190px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">
                {role === 'seller' ? 'Clients' : 'Sellers'}
              </h2>
              <Button size="sm" variant="outline" onClick={openContacts}>
                <Plus className="w-4 h-4 mr-1" />
                Start
              </Button>
            </div>

            <div className="mb-3">
              <Input
                placeholder="Search conversations..."
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            {loadingConversations ? (
              <p className="text-sm text-muted-foreground">Loading conversations...</p>
            ) : filteredConversationRows.length > 0 ? (
              <div className="space-y-2">
                {filteredConversationRows.map((row) => (
                  <button
                    key={row.id}
                    onClick={() => setSelectedChatId(row.id)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${
                      selectedChatId === row.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          row.participant.image ||
                          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
                        }
                        alt={row.participant.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{row.participant.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{row.lastMessage}</p>
                      </div>
                      {row.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                          {row.unread}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No conversations yet</p>
              </div>
            )}
          </Card>

          <Card className="p-0 h-[calc(100vh-190px)] flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                <div className="p-3 border-b border-border flex items-center gap-2">
                  <img
                    src={
                      selectedConversation.participant.image ||
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
                    }
                    alt={selectedConversation.participant.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{selectedConversation.participant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.participant.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {loadingMessages ? (
                    <p className="text-sm text-muted-foreground">Loading chat...</p>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => {
                      const mine = msg.sender_id === userId;
                      return (
                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                              mine ? 'bg-primary text-white' : 'bg-secondary'
                            }`}
                          >
                            <p className="text-sm">{msg.message_text}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No messages yet. Say hello.</p>
                  )}
                </div>

                <div className="border-t border-border p-3">
                  <div className="flex items-end gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendCurrentMessage();
                        }
                      }}
                    />
                    <Button onClick={sendCurrentMessage} disabled={!draft.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start chatting
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title="Start Conversation">
            <div className="p-4">
          <div className="mb-3">
            <Input
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          {contactLoading ? (
            <p className="text-sm text-muted-foreground">Loading contacts...</p>
          ) : filteredContacts.length > 0 ? (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.userId}
                  onClick={() => startConversation(contact)}
                  className="w-full text-left p-2 rounded-lg border border-border hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        contact.image ||
                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
                      }
                      alt={contact.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.subtitle || 'User'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No contacts available yet.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}



