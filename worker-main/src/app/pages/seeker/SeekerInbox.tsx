import { useState, useEffect } from 'react';
import { Send, Search } from 'lucide-react';
import { api } from '../../api';

interface Msg { id: number; sender_id: number; sender_name: string; content: string; created_at: string; }
interface Conv { id: number; other_name: string; other_id: number; last_message: string; last_message_at: string; unread: number; }

export const SeekerInbox = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [myId, setMyId] = useState<number>(0);

  useEffect(() => {
    api.get<any>('/users/me').then(u => setMyId(u.id));
    api.get<Conv[]>('/conversations').then(setConversations).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedChat) api.get<Msg[]>(`/conversations/${selectedChat}/messages`).then(setMessages).catch(() => {});
  }, [selectedChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;
    await api.post(`/conversations/${selectedChat}/messages`, { content: messageText });
    setMessageText('');
    api.get<Msg[]>(`/conversations/${selectedChat}/messages`).then(setMessages);
    api.get<Conv[]>('/conversations').then(setConversations);
  };

  const filtered = conversations.filter(c => c.other_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const timeAgo = (d: string) => { if (!d) return ''; const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; };

  return (
    <div>
      <h1 className="text-3xl mb-8">Messages</h1>
      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-gray-200 flex-col`}>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length > 0 ? filtered.map((c) => (
                <button key={c.id} onClick={() => setSelectedChat(c.id)}
                  className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left ${selectedChat === c.id ? 'bg-blue-50' : ''}`}>
                  <div className="flex justify-between items-start mb-1"><span className="font-medium">{c.other_name}</span><span className="text-xs text-gray-500">{timeAgo(c.last_message_at)}</span></div>
                  <div className="flex justify-between items-center"><p className="text-sm text-gray-600 truncate">{c.last_message}</p>
                    {c.unread > 0 && <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">{c.unread}</span>}</div>
                </button>
              )) : <p className="text-center py-8 text-gray-500">No conversations yet</p>}
            </div>
          </div>
          <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {selectedChat ? (<>
              <div className="p-4 border-b flex items-center gap-3">
                <button onClick={() => setSelectedChat(null)} className="md:hidden p-1 hover:bg-gray-100 rounded">←</button>
                <h2 className="text-lg">{filtered.find(c => c.id === selectedChat)?.other_name}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === myId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${m.sender_id === myId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      <p>{m.content}</p>
                      <p className={`text-xs mt-1 ${m.sender_id === myId ? 'text-blue-100' : 'text-gray-500'}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSend} className="p-4 border-t">
                <div className="flex gap-2">
                  <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"><Send className="w-5 h-5" /></button>
                </div>
              </form>
            </>) : <div className="flex-1 flex items-center justify-center text-gray-500"><p>Select a conversation</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};
