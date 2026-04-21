import React, { useEffect, useState } from 'react';
import { SplashScreen } from './components/onboarding/SplashScreen';
import { RoleSelection } from './components/onboarding/RoleSelection';
import { AuthScreen } from './components/auth/AuthScreen';
import { SellerProfileCreation } from './components/seller/SellerProfileCreation';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { SellerPosts } from './components/seller/SellerPosts';
import { SellerJobManagement } from './components/seller/SellerJobManagement';
import { BuyerHome } from './components/buyer/BuyerHome';
import { BuyerBookings } from './components/buyer/BuyerBookings';
import { WorkerProfileView } from './components/buyer/WorkerProfileView';
import { ServiceRequest } from './components/buyer/ServiceRequest';
import { MessagesCenter } from './components/shared/MessagesCenter';
import { ChatScreen } from './components/shared/ChatScreen';
import { ProfileScreen } from './components/shared/ProfileScreen';
import { BottomNav } from './components/ui/BottomNav';
import { TopHeader } from './components/ui/TopHeader';
import { dbService } from './services/database.service';

type Screen =
  | 'splash'
  | 'role-selection'
  | 'auth'
  | 'seller-profile-creation'
  | 'seller-dashboard'
  | 'seller-posts'
  | 'seller-jobs'
  | 'seller-messages'
  | 'seller-profile'
  | 'buyer-home'
  | 'buyer-map'
  | 'buyer-bookings'
  | 'buyer-messages'
  | 'buyer-profile'
  | 'worker-profile'
  | 'service-request'
  | 'chat';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userId = localStorage.getItem('user_id');
        const storedRole = localStorage.getItem('user_role') as 'buyer' | 'seller' | null;

        if (!token || !userId) {
          setIsAuthenticated(false);
          setCurrentScreen('splash');
          return;
        }

        setIsAuthenticated(true);
        const parsedUserId = parseInt(userId, 10);

        let resolvedRole: 'buyer' | 'seller' = storedRole || 'buyer';
        try {
          const me = await dbService.getUser(parsedUserId);
          resolvedRole = me.role === 'seller' ? 'seller' : 'buyer';
          localStorage.setItem('user_role', resolvedRole);
        } catch {
          // Keep stored role when user fetch is unavailable.
        }
        setUserRole(resolvedRole);

        const savedScreen = sessionStorage.getItem('last_screen') as Screen | null;
        const sellerScreens: Screen[] = [
          'seller-dashboard',
          'seller-posts',
          'seller-jobs',
          'seller-messages',
          'seller-profile',
        ];
        const buyerScreens: Screen[] = [
          'buyer-home',
          'buyer-map',
          'buyer-bookings',
          'buyer-messages',
          'buyer-profile',
        ];
        const allowed = resolvedRole === 'seller' ? sellerScreens : buyerScreens;

        if (savedScreen && allowed.includes(savedScreen)) {
          setCurrentScreen(savedScreen);
          return;
        }

        if (resolvedRole === 'seller') {
          try {
            await dbService.getSellerProfileByUser(parsedUserId);
            setHasCompletedProfile(true);
            setCurrentScreen('seller-dashboard');
          } catch {
            setHasCompletedProfile(false);
            setCurrentScreen('seller-profile-creation');
          }
          return;
        }

        setCurrentScreen('buyer-home');
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrapSession();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    sessionStorage.setItem('last_screen', currentScreen);
  }, [currentScreen, isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    sessionStorage.removeItem('last_screen');
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentScreen('splash');
  };

  const handleSplashContinue = () => {
    setCurrentScreen('role-selection');
  };

  const handleRoleSelection = (role: 'buyer' | 'seller') => {
    setUserRole(role);
    setCurrentScreen('auth');
  };

  const handleAuth = async (_authData: any) => {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    if (!token || !userId) {
      setIsAuthenticated(false);
      setCurrentScreen('auth');
      return;
    }

    setIsAuthenticated(true);

    if (userRole === 'seller') {
      try {
        await dbService.getSellerProfileByUser(parseInt(userId, 10));
        setHasCompletedProfile(true);
        setCurrentScreen('seller-dashboard');
        return;
      } catch {
        // No seller profile yet.
      }
      setHasCompletedProfile(false);
      setCurrentScreen('seller-profile-creation');
      return;
    }

    setCurrentScreen('buyer-home');
  };

  const handleProfileCreationComplete = (_profileData: any) => {
    setHasCompletedProfile(true);
    setCurrentScreen('seller-dashboard');
  };

  const handleNavigation = (page: string) => {
    if (page.startsWith('worker-')) {
      const workerId = parseInt(page.split('-')[1], 10);
      setSelectedWorkerId(workerId);
      setCurrentScreen('worker-profile');
      return;
    }

    if (page.startsWith('chat-')) {
      const chatId = parseInt(page.split('-')[1], 10);
      setSelectedChatId(chatId);
      setCurrentScreen('chat');
      return;
    }

    if (userRole === 'seller') {
      if (page === 'dashboard') setCurrentScreen('seller-dashboard');
      else if (page === 'jobs' || page === 'seller-jobs') setCurrentScreen('seller-jobs');
      else if (page === 'posts') setCurrentScreen('seller-posts');
      else if (page === 'messages') setCurrentScreen('seller-messages');
      else if (page === 'profile' || page === 'seller-profile') setCurrentScreen('seller-profile');
      return;
    }

    if (page === 'home') setCurrentScreen('buyer-home');
    else if (page === 'map') setCurrentScreen('buyer-map');
    else if (page === 'messages') setCurrentScreen('buyer-messages');
    else if (page === 'profile' || page === 'buyer-profile') setCurrentScreen('buyer-profile');
    else if (page === 'buyer-bookings') setCurrentScreen('buyer-bookings');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onContinue={handleSplashContinue} />;

      case 'role-selection':
        return <RoleSelection onSelectRole={handleRoleSelection} />;

      case 'auth':
        return (
          <AuthScreen
            role={userRole!}
            onAuth={handleAuth}
            onBack={() => setCurrentScreen('role-selection')}
          />
        );

      case 'seller-profile-creation':
        return <SellerProfileCreation onComplete={handleProfileCreationComplete} />;

      case 'seller-dashboard':
        return <SellerDashboard onNavigate={handleNavigation} />;

      case 'seller-posts':
        return <SellerPosts onNavigate={handleNavigation} />;

      case 'seller-jobs':
        return <SellerJobManagement onNavigate={handleNavigation} />;

      case 'seller-messages':
        return <MessagesCenter role="seller" />;

      case 'seller-profile':
        return <ProfileScreen role="seller" onNavigate={handleNavigation} onLogout={handleLogout} />;

      case 'buyer-home':
      case 'buyer-map':
        return <BuyerHome onNavigate={handleNavigation} />;

      case 'buyer-bookings':
        return <BuyerBookings onNavigate={handleNavigation} />;

      case 'buyer-messages':
        return <MessagesCenter role="buyer" />;

      case 'buyer-profile':
        return <ProfileScreen role="buyer" onNavigate={handleNavigation} onLogout={handleLogout} />;

      case 'worker-profile':
        return (
          <WorkerProfileView
            workerId={selectedWorkerId!}
            onBack={() => setCurrentScreen('buyer-home')}
            onRequestService={() => setCurrentScreen('service-request')}
            onMessage={async (worker) => {
              try {
                const targetUserId = worker.user_id || worker.user?.id;
                if (!targetUserId) {
                  alert('Unable to start chat with this user right now.');
                  return;
                }
                const conversation = await dbService.getOrCreateConversation(targetUserId);
                setSelectedChatId(conversation.id);
                setCurrentScreen('chat');
              } catch (error) {
                console.error('Failed to open chat:', error);
                alert('Unable to open chat. Please try again.');
              }
            }}
          />
        );

      case 'service-request':
        return (
          <ServiceRequest
            workerId={selectedWorkerId!}
            onBack={() => setCurrentScreen('worker-profile')}
            onSubmit={() => {
              alert('Service request submitted! The worker will respond soon.');
              setCurrentScreen('buyer-home');
            }}
          />
        );

      case 'chat':
        return (
          <ChatScreen
            chatId={selectedChatId!}
            onBack={() => {
              setCurrentScreen(userRole === 'buyer' ? 'buyer-messages' : 'seller-messages');
            }}
          />
        );

      default:
        return <SplashScreen onContinue={handleSplashContinue} />;
    }
  };

  const showBottomNav =
    isAuthenticated &&
    currentScreen !== 'splash' &&
    currentScreen !== 'role-selection' &&
    currentScreen !== 'auth' &&
    currentScreen !== 'seller-profile-creation' &&
    currentScreen !== 'seller-messages' &&
    currentScreen !== 'buyer-messages' &&
    currentScreen !== 'worker-profile' &&
    currentScreen !== 'service-request' &&
    currentScreen !== 'chat';

  const showTopHeader =
    isAuthenticated &&
    currentScreen !== 'splash' &&
    currentScreen !== 'role-selection' &&
    currentScreen !== 'auth';

  const getActiveNavItem = () => {
    if (userRole === 'seller') {
      if (currentScreen === 'seller-dashboard') return 'dashboard';
      if (currentScreen === 'seller-jobs') return 'jobs';
      if (currentScreen === 'seller-posts') return 'posts';
      if (currentScreen === 'seller-messages') return 'messages';
      if (currentScreen === 'seller-profile') return 'profile';
      return 'dashboard';
    }

    if (currentScreen === 'buyer-home' || currentScreen === 'buyer-map') return 'home';
    if (currentScreen === 'buyer-messages') return 'messages';
    if (currentScreen === 'buyer-profile' || currentScreen === 'buyer-bookings') return 'profile';
    return 'home';
  };

  const getHeaderTitle = () => {
    if (userRole === 'seller') {
      if (currentScreen === 'seller-dashboard') return 'Seller Dashboard';
      if (currentScreen === 'seller-posts') return 'Seller Posts';
      if (currentScreen === 'seller-jobs') return 'Seller Jobs';
      if (currentScreen === 'seller-messages') return 'Messages';
      if (currentScreen === 'seller-profile') return 'Profile';
      return 'Service Marketplace';
    }

    if (currentScreen === 'buyer-home' || currentScreen === 'buyer-map') return '';
    if (currentScreen === 'buyer-bookings') return 'My Bookings';
    if (currentScreen === 'buyer-messages') return 'Messages';
    if (currentScreen === 'buyer-profile') return 'Profile';
    if (currentScreen === 'worker-profile') return 'Worker Profile';
    if (currentScreen === 'service-request') return 'Service Request';
    if (currentScreen === 'chat') return 'Chat';
    return 'Service Marketplace';
  };

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {showTopHeader && userRole && (
        <TopHeader
          title={getHeaderTitle()}
          role={userRole}
          onNavigateHome={() =>
            setCurrentScreen(userRole === 'seller' ? 'seller-dashboard' : 'buyer-home')
          }
          onNavigateMessages={() =>
            setCurrentScreen(userRole === 'seller' ? 'seller-messages' : 'buyer-messages')
          }
          onNavigateProfile={() =>
            setCurrentScreen(userRole === 'seller' ? 'seller-profile' : 'buyer-profile')
          }
          onLogout={handleLogout}
        />
      )}

      {renderScreen()}

      {showBottomNav && userRole && (
        <BottomNav
          active={getActiveNavItem()}
          onNavigate={(page) => {
            if (userRole === 'seller') {
              if (page === 'dashboard') setCurrentScreen('seller-dashboard');
              else if (page === 'jobs') setCurrentScreen('seller-jobs');
              else if (page === 'posts') setCurrentScreen('seller-posts');
              else if (page === 'messages') setCurrentScreen('seller-messages');
              else if (page === 'profile') setCurrentScreen('seller-profile');
            } else {
              if (page === 'home') setCurrentScreen('buyer-home');
              else if (page === 'map') setCurrentScreen('buyer-map');
              else if (page === 'messages') setCurrentScreen('buyer-messages');
              else if (page === 'profile') setCurrentScreen('buyer-profile');
            }
          }}
          role={userRole}
        />
      )}
    </div>
  );
}

export default App;
