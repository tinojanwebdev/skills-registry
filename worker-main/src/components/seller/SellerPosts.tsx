import React, { useState, useEffect, useRef } from 'react';
import { Plus, Image as ImageIcon, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/Modal';
import { dbService } from '../../services/database.service';
import { SellerPost } from '../../types/database';

interface SellerPostsProps {
  onNavigate: (page: string) => void;
}

export function SellerPosts({ onNavigate }: SellerPostsProps) {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState<SellerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [postData, setPostData] = useState({
    title: '',
    description: '',
    type: 'promotion',
    visibilityRadius: 10,
    expiryDays: 7,
  });
  
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('user_id');
        if (!userId) return;
        const seller = await dbService.getSellerProfileByUser(parseInt(userId));
        const data = await dbService.getSellerPosts(seller.id);
        setPosts(data);
      } catch (err) {
        console.error('Failed to load posts:', err);
        setError('Please create your seller profile first.');
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);
  
  const handleCreatePost = async () => {
    try {
      setCreating(true);
      setError('');
      const userId = localStorage.getItem('user_id');
      if (!userId) throw new Error('Missing user id');
      const seller = await dbService.getSellerProfileByUser(parseInt(userId));
      const created = await dbService.createSellerPost({
        seller_id: seller.id,
        title: postData.title,
        description: postData.description,
        type: postData.type as any,
        visibility_radius: postData.visibilityRadius,
        expiry_days: postData.expiryDays,
        image: imageFile,
      });
      setPosts([created, ...posts]);
      setShowCreatePost(false);
      setPostData({
        title: '',
        description: '',
        type: 'promotion',
        visibilityRadius: 10,
        expiryDays: 7,
      });
      setImageFile(null);
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Please create your seller profile first.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      await dbService.deleteSellerPost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete post:', err);
      setError('Failed to delete post.');
    }
  };
  
  return (
    <div className="min-h-screen bg-secondary pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-[#10B981] text-white p-6">
        <h1 className="text-2xl font-bold mb-1">My Posts</h1>
        <p className="text-white/90">Promote your services</p>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Create Post Button */}
        <Button
          variant="accent"
          size="lg"
          fullWidth
          onClick={() => setShowCreatePost(true)}
          className="shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Post
        </Button>
        
        {/* Posts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-muted-foreground">No posts yet.</div>
          ) : posts.map((post) => {
            const expires = post.expires_at ? new Date(post.expires_at) : null;
            const expiresLabel = expires ? expires.toLocaleDateString() : 'No expiry';
            return (
            <Card key={post.id} hover>
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        post.type === 'discount'
                          ? 'bg-accent/10 text-accent'
                          : post.type === 'availability'
                          ? 'bg-[#10B981]/10 text-[#10B981]'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {post.type === 'discount'
                        ? 'Discount'
                        : post.type === 'availability'
                        ? 'Availability Update'
                        : 'Promotion'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{post.description}</p>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {post.views || 0} views
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {post.visibility_radius} km
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {expiresLabel}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" fullWidth>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  className="text-destructive"
                  onClick={() => handleDeletePost(post.id)}
                >
                  Delete
                </Button>
                <Button variant="accent" size="sm" fullWidth>
                  Boost Post
                </Button>
              </div>
            </Card>
          )})}
        </div>
      </div>
      
      {/* Create Post Modal */}
      <Modal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        title="Create New Post"
        size="lg"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Post Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['promotion', 'discount', 'availability'].map((type) => (
                <button
                  key={type}
                  onClick={() => setPostData({ ...postData, type })}
                  className={`py-2 px-4 rounded-lg border-2 transition-all capitalize ${
                    postData.type === type
                      ? 'border-primary bg-primary text-white'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <Input
            label="Post Title"
            placeholder="e.g., 20% Off All Services"
            value={postData.title}
            onChange={(e) => setPostData({ ...postData, title: e.target.value })}
          />
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[100px]"
              placeholder="Describe your offer or update..."
              value={postData.description}
              onChange={(e) => setPostData({ ...postData, description: e.target.value })}
            />
          </div>
          
          <div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImageFile(file);
              }}
            />
            <Button variant="outline" fullWidth onClick={() => imageInputRef.current?.click()}>
              <ImageIcon className="w-5 h-5 mr-2" />
              {imageFile ? 'Change Image' : 'Add Image'}
            </Button>
            {imageFile && (
              <p className="text-xs text-muted-foreground mt-2">{imageFile.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Visibility Radius: {postData.visibilityRadius} km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={postData.visibilityRadius}
              onChange={(e) => setPostData({ ...postData, visibilityRadius: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Expiry</label>
            <select
              value={postData.expiryDays}
              onChange={(e) => setPostData({ ...postData, expiryDays: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
            </select>
          </div>
          
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreatePost(false)} fullWidth>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePost} fullWidth disabled={creating}>
              {creating ? 'Publishing...' : 'Publish Post'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}



