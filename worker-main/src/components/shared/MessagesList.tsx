import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { dbService } from '../../services/database.service';
import { ConversationWithDetails } from '../../types/database';

interface MessagesListProps {
  role: 'buyer' | 'seller';
  onSelectChat: (chatId: number) => void;
  title?: string;
  subtitle?: string;
}

export function MessagesList({ role, onSelectChat, title, subtitle }: MessagesListProps) {
  const [chats, setChats] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('user_id');
        if (userId) {
          const data = await dbService.getConversations(parseInt(userId));
          setChats(data);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, []);
  
  // Transform to display format
  const displayChats = chats.map(chat => ({
    id: chat.id,
    participant: {
      name: role === 'buyer' 
        ? chat.seller?.full_name || 'Worker'
        : chat.buyer?.full_name || 'Client',
      image: role === 'buyer'
        ? chat.seller?.profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
        : chat.buyer?.profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      service: role === 'buyer' ? 'Service Provider' : 'Client',
    },
    lastMessage: chat.last_message?.message_text || 'No messages yet',
    timestamp: chat.last_message_at ? new Date(chat.last_message_at).toLocaleDateString() : '',
    unread: chat.unread_count || 0,
  }));
  
  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="bg-gradient-to-r from-primary to-[#10B981] text-white p-6">
        <h1 className="text-2xl font-bold mb-1">{title || 'Messages'}</h1>
        <p className="text-white/90">{subtitle || 'Your conversations'}</p>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : displayChats.length > 0 ? (
          displayChats.map((chat) => (
            <Card key={chat.id} hover onClick={() => onSelectChat(chat.id)}>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={chat.participant.image}
                    alt={chat.participant.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {chat.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {chat.unread}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{chat.participant.name}</h3>
                    <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Messages Yet</h3>
            <p className="text-muted-foreground">
              {role === 'buyer'
                ? 'Start a conversation with a worker'
                : 'Your client messages will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

