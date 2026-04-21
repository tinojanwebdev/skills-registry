// Frontend-Backend Integration Test Script
// Run this to verify all database connections are working

import { dbService } from '../services/database.service';

interface TestResult {
  test: string;
  status: 'pass' | 'fail';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('🧪 Starting Integration Tests...\n');

  // Test 1: Authentication - Login
  try {
    const loginResult = await dbService.login('test@example.com', 'password123');
    results.push({
      test: 'Login',
      status: 'pass',
      message: 'User logged in successfully',
      data: { userId: loginResult.user.id, hasToken: !!loginResult.token }
    });
  } catch (error) {
    results.push({
      test: 'Login',
      status: 'fail',
      message: `Login failed: ${error.message}`
    });
  }

  // Test 2: Authentication - Register
  try {
    const registerResult = await dbService.register({
      email: 'newuser@example.com',
      full_name: 'Test User',
      role: 'buyer'
    });
    results.push({
      test: 'Register',
      status: 'pass',
      message: 'User registered successfully',
      data: { userId: registerResult.user.id }
    });
  } catch (error) {
    results.push({
      test: 'Register',
      status: 'fail',
      message: `Registration failed: ${error.message}`
    });
  }

  // Test 3: Get Nearby Sellers
  try {
    const sellers = await dbService.getNearbySellers({
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 10
    });
    results.push({
      test: 'Get Nearby Sellers',
      status: sellers.length > 0 ? 'pass' : 'fail',
      message: `Found ${sellers.length} sellers`,
      data: { count: sellers.length }
    });
  } catch (error) {
    results.push({
      test: 'Get Nearby Sellers',
      status: 'fail',
      message: `Failed to fetch sellers: ${error.message}`
    });
  }

  // Test 4: Get Seller by ID
  try {
    const seller = await dbService.getSellerById(1);
    results.push({
      test: 'Get Seller by ID',
      status: seller ? 'pass' : 'fail',
      message: seller ? `Fetched seller: ${seller.user?.full_name}` : 'Seller not found',
      data: seller ? { id: seller.id, name: seller.user?.full_name } : null
    });
  } catch (error) {
    results.push({
      test: 'Get Seller by ID',
      status: 'fail',
      message: `Failed to fetch seller: ${error.message}`
    });
  }

  // Test 5: Get Categories
  try {
    const categories = await dbService.getCategories();
    results.push({
      test: 'Get Categories',
      status: categories.length > 0 ? 'pass' : 'fail',
      message: `Found ${categories.length} categories`,
      data: { count: categories.length, categories: categories.map(c => c.name) }
    });
  } catch (error) {
    results.push({
      test: 'Get Categories',
      status: 'fail',
      message: `Failed to fetch categories: ${error.message}`
    });
  }

  // Test 6: Create Booking
  try {
    const booking = await dbService.createBooking({
      buyer_id: 1,
      seller_id: 1,
      category_id: 1,
      title: 'Test Booking',
      description: 'Test Description',
      scheduled_date: new Date('2026-03-15'),
      scheduled_time: '14:00',
      estimated_hours: 2,
      hourly_rate: 50,
      total_amount: 100,
      payment_method: 'cash'
    });
    results.push({
      test: 'Create Booking',
      status: 'pass',
      message: `Booking created with ID: ${booking.id}`,
      data: { bookingId: booking.id }
    });
  } catch (error) {
    results.push({
      test: 'Create Booking',
      status: 'fail',
      message: `Failed to create booking: ${error.message}`
    });
  }

  // Test 7: Get Buyer Bookings
  try {
    const bookings = await dbService.getBuyerBookings(1);
    results.push({
      test: 'Get Buyer Bookings',
      status: 'pass',
      message: `Found ${bookings.length} bookings`,
      data: { count: bookings.length }
    });
  } catch (error) {
    results.push({
      test: 'Get Buyer Bookings',
      status: 'fail',
      message: `Failed to fetch buyer bookings: ${error.message}`
    });
  }

  // Test 8: Get Seller Bookings
  try {
    const bookings = await dbService.getSellerBookings(1);
    results.push({
      test: 'Get Seller Bookings',
      status: 'pass',
      message: `Found ${bookings.length} bookings`,
      data: { count: bookings.length }
    });
  } catch (error) {
    results.push({
      test: 'Get Seller Bookings',
      status: 'fail',
      message: `Failed to fetch seller bookings: ${error.message}`
    });
  }

  // Test 9: Update Booking Status
  try {
    const booking = await dbService.updateBookingStatus(1, 'accepted');
    results.push({
      test: 'Update Booking Status',
      status: 'pass',
      message: 'Booking status updated successfully',
      data: { bookingId: booking.id, status: booking.status }
    });
  } catch (error) {
    results.push({
      test: 'Update Booking Status',
      status: 'fail',
      message: `Failed to update booking: ${error.message}`
    });
  }

  // Test 10: Get Conversations
  try {
    const conversations = await dbService.getConversations(1);
    results.push({
      test: 'Get Conversations',
      status: 'pass',
      message: `Found ${conversations.length} conversations`,
      data: { count: conversations.length }
    });
  } catch (error) {
    results.push({
      test: 'Get Conversations',
      status: 'fail',
      message: `Failed to fetch conversations: ${error.message}`
    });
  }

  // Test 11: Get Messages
  try {
    const messages = await dbService.getMessages(1);
    results.push({
      test: 'Get Messages',
      status: 'pass',
      message: `Found ${messages.length} messages`,
      data: { count: messages.length }
    });
  } catch (error) {
    results.push({
      test: 'Get Messages',
      status: 'fail',
      message: `Failed to fetch messages: ${error.message}`
    });
  }

  // Test 12: Send Message
  try {
    const message = await dbService.sendMessage({
      conversation_id: 1,
      sender_id: 1,
      message_text: 'Test message',
      message_type: 'text'
    });
    results.push({
      test: 'Send Message',
      status: 'pass',
      message: 'Message sent successfully',
      data: { messageId: message.id }
    });
  } catch (error) {
    results.push({
      test: 'Send Message',
      status: 'fail',
      message: `Failed to send message: ${error.message}`
    });
  }

  // Test 13: Create Review
  try {
    const review = await dbService.createReview({
      booking_id: 1,
      reviewer_id: 1,
      reviewee_id: 2,
      rating: 5,
      comment: 'Excellent service!'
    });
    results.push({
      test: 'Create Review',
      status: 'pass',
      message: 'Review created successfully',
      data: { reviewId: review.id }
    });
  } catch (error) {
    results.push({
      test: 'Create Review',
      status: 'fail',
      message: `Failed to create review: ${error.message}`
    });
  }

  // Test 14: Get Seller Reviews
  try {
    const reviews = await dbService.getSellerReviews(1);
    results.push({
      test: 'Get Seller Reviews',
      status: 'pass',
      message: `Found ${reviews.length} reviews`,
      data: { count: reviews.length }
    });
  } catch (error) {
    results.push({
      test: 'Get Seller Reviews',
      status: 'fail',
      message: `Failed to fetch reviews: ${error.message}`
    });
  }

  // Print Results
  console.log('\n📊 Test Results:\n');
  console.log('='.repeat(60));
  
  let passCount = 0;
  let failCount = 0;

  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`\n${index + 1}. ${icon} ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log(`   Data:`, result.data);
    }
    
    result.status === 'pass' ? passCount++ : failCount++;
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed out of ${results.length} tests`);
  console.log(`\n${passCount === results.length ? '🎉 All tests passed!' : '⚠️  Some tests failed. Check the details above.'}\n`);
}

// Export for testing
export { runTests };

// Run tests if executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to window for console access
  (window as any).testIntegration = runTests;
  console.log('💡 Run "testIntegration()" in the browser console to test all integrations');
} else {
  // Node environment - run immediately
  runTests().catch(console.error);
}
