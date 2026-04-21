import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Mic, MapPin } from 'lucide-react';
import { Card } from '../ui/card';
import { dbService } from '../../services/database.service';
import { Message } from '../../types/database';

interface ChatScreenProps {
  chatId: number;
  onBack: () => void;
}

export function ChatScreen({ chatId, onBack }: ChatScreenProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock data
  const chat = {
    id: chatId,
    participant: {
      name: 'John Smith',
      image: 'https://images.unsplash.com/photo-1636218685495-8f6545aadb71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2lhbiUyMHRlY2huaWNpYW4lMjB3b3JraW5nfGVufDF8fHx8MTc3MDE3MzYwMXww&ixlib=rb-4.1.0&q=80&w=1080',
      service: 'Professional Electrician',
    },
  };
  
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const data = await dbService.getMessages(chatId);
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [chatId]);
  
  const handleSend = async () => {
    if (message.trim()) {
      try {
        const userId = localStorage.getItem('user_id');
        const newMessage = await dbService.sendMessage({
          conversation_id: chatId,
          sender_id: parseInt(userId || '1'),
          message_text: message,
          message_type: 'text',
        });
        setMessages([...messages, newMessage]);
        setMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <img
            src={chat.participant.image}
            alt={chat.participant.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold">{chat.participant.name}</h3>
            <p className="text-sm text-muted-foreground">{chat.participant.service}</p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === parseInt(localStorage.getItem('user_id') || '1') ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] ${
                  msg.sender_id === parseInt(localStorage.getItem('user_id') || '1')
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-foreground'
                  } rounded-2xl px-4 py-2.5`}
                >
                  <p className="text-sm">{msg.message_text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender_id === parseInt(localStorage.getItem('user_id') || '1') ? 'text-white/70' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
      
      {/* Input */}
      <div className="sticky bottom-0 z-30 bg-card border-t border-border p-4 supports-[padding:max(0px)]:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto flex items-end space-x-2">
          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <MapPin className="w-6 h-6 text-muted-foreground" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={1}
            />
          </div>
          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <Mic className="w-6 h-6 text-muted-foreground" />
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

