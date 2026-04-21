import React, { useState, useEffect } from 'react';
import { Eye, Briefcase, DollarSign, Star, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { dbService } from '../../services/database.service';
import { BookingWithDetails, User, SellerProfile, SellerPost } from '../../types/database';

interface SellerDashboardProps {
  onNavigate: (page: string) => void;
}

export function SellerDashboard({ onNavigate }: SellerDashboardProps) {
  const [recentJobs, setRecentJobs] = useState<BookingWithDetails[]>([]);
  const [recentPosts, setRecentPosts] = useState<SellerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [jobsError, setJobsError] = useState('');
  const [postsError, setPostsError] = useState('');
  const [stats, setStats] = useState({
    profileViews: 0,
    activeJobs: 0,
    completedJobs: 0,
    earnings: 0,
  });
  
  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      try {
        if (alive) setLoading(true);
        const userId = localStorage.getItem('user_id');
        if (userId) {
          const userData = await dbService.getUser(parseInt(userId));
          if (alive) setUser(userData);

          let seller = null;
          try {
            seller = await dbService.getSellerProfileByUser(parseInt(userId));
            if (alive) setSellerProfile(seller);
          } catch {
            if (alive) setSellerProfile(null);
          }

          const sellerId = seller?.id;
          let bookings: BookingWithDetails[] = [];
          const profileViews = sellerId ? await dbService.getSellerProfileViews(sellerId) : 0;

          try {
            bookings = sellerId ? await dbService.getSellerBookings(sellerId) : [];
            if (alive) {
              setRecentJobs(bookings.slice(0, 3));
              setJobsError('');
            }
          } catch (bookingErr) {
            console.error('Failed to fetch dashboard jobs:', bookingErr);
            if (alive) {
              setRecentJobs([]);
              setJobsError('Jobs are not available right now.');
            }
          }

          try {
            const posts = sellerId ? await dbService.getSellerPosts(sellerId) : [];
            if (alive) {
              setRecentPosts(Array.isArray(posts) ? posts.slice(0, 3) : []);
              setPostsError('');
            }
          } catch (postErr) {
            console.error('Failed to fetch dashboard posts:', postErr);
            if (alive) {
              setRecentPosts([]);
              setPostsError('Posts are not available right now.');
            }
          }
          
          // Calculate stats
          const active = bookings.filter(b => 
            b.status === 'pending' || b.status === 'accepted' || b.status === 'in_progress'
          ).length;
          const completed = bookings.filter(b => b.status === 'completed').length;
          const earnings = bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.total_amount || 0), 0);
          
          if (alive) {
            setStats({
              profileViews,
              activeJobs: active,
              completedJobs: completed,
              earnings,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchData();

    const onFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(fetchData, 15000);

    return () => {
      alive = false;
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, []);
  
  const statsDisplay = [
    { label: 'Profile Views', value: stats.profileViews.toString(), icon: Eye, color: 'text-primary' },
    { label: 'Active Jobs', value: stats.activeJobs.toString(), icon: Briefcase, color: 'text-accent' },
    { label: 'Completed', value: stats.completedJobs.toString(), icon: CheckCircle, color: 'text-[#10B981]' },
    { label: 'Earnings', value: `LRs ${stats.earnings.toLocaleString()}`, icon: DollarSign, color: 'text-primary' },
  ];

  const ratingValue = Number.isFinite(Number(sellerProfile?.rating))
    ? Number(sellerProfile?.rating)
    : 0;
  const roundedRating = Math.max(0, Math.min(5, Math.round(ratingValue)));
  
  return (
    <div className="min-h-screen bg-secondary pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-[#10B981] text-white p-6">
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-white/90">Welcome back{user?.full_name ? `, ${user.full_name}` : ''}!</p>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Profile Completion */}
        <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">Complete Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                {sellerProfile ? 'Profile created' : 'Not created yet'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-accent" />
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mb-3">
            <div className="bg-accent h-2 rounded-full" style={{ width: sellerProfile ? '100%' : '20%' }} />
          </div>
          <Button variant="accent" size="sm">Add Portfolio Images</Button>
        </Card>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsDisplay.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center">
                <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            );
          })}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            onClick={() => onNavigate('posts')}
            className="h-16"
          >
            Create Post
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate('jobs')}
            className="h-16"
          >
            View Jobs
          </Button>
        </div>
        
        {/* Recent Jobs */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Job Requests</h3>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-sm text-primary hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {recentJobs.map((job) => {
              const statusLabel = job.status?.replace('_', ' ') || 'pending';
              const statusLower = job.status || 'pending';
              const buyerName = (job as any).buyer_name || job.buyer?.full_name || 'Client';
              const scheduled = job.scheduled_date
                ? new Date(job.scheduled_date).toLocaleDateString()
                : (job as any).created_at ? new Date((job as any).created_at).toLocaleDateString() : '';
              const amount = job.total_amount || 0;
              return (
              <div
                key={job.id}
                className="p-4 bg-secondary rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{buyerName}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      statusLower === 'completed'
                        ? 'bg-[#10B981]/10 text-[#10B981]'
                        : statusLower === 'in_progress'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-accent/10 text-accent'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {scheduled}
                  </span>
                  <span className="font-semibold text-primary">LRs {amount}</span>
                </div>
              </div>
            )})}
            {!loading && recentJobs.length === 0 && (
              <div className="text-sm text-muted-foreground">No jobs yet.</div>
            )}
            {!loading && jobsError && (
              <div className="text-sm text-destructive">{jobsError}</div>
            )}
          </div>
        </Card>

        {/* Recent Posts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Posts</h3>
            <button
              onClick={() => onNavigate('posts')}
              className="text-sm text-primary hover:underline"
            >
              Manage Posts
            </button>
          </div>

          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 bg-secondary rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{post.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.description || 'No description'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      post.type === 'discount'
                        ? 'bg-accent/10 text-accent'
                        : post.type === 'availability'
                        ? 'bg-[#10B981]/10 text-[#10B981]'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {post.type}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {post.views || 0} views
                </div>
              </div>
            ))}
            {!loading && recentPosts.length === 0 && (
              <div className="text-sm text-muted-foreground">No posts yet.</div>
            )}
            {!loading && postsError && (
              <div className="text-sm text-destructive">{postsError}</div>
            )}
          </div>
        </Card>
        
        {/* Rating Summary */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Your Rating</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < roundedRating ? 'fill-accent text-accent' : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-lg">{ratingValue.toFixed(1)}</span>
                <span className="text-muted-foreground">({sellerProfile?.total_reviews ?? 0} reviews)</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('seller-jobs')}>
              View All Reviews
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}


