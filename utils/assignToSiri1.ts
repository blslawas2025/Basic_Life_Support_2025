// Simple utility to assign all profiles to BLS Siri 1 2025
// Import this in your app and call assignAllToSiri1() when needed

import { ProfileService } from '../services/ProfileService';
import { CourseSessionService } from '../services/CourseSessionService';

export async function assignAllToSiri1(): Promise<void> {
  try {
    console.log('🚀 Starting assignment of all profiles to BLS Siri 1 2025...');
    
    // Get the BLS Siri 1 2025 course session
    const courseSessions = await CourseSessionService.getAllCourseSessions();
    const siri1Session = courseSessions.find(session => session.full_name === 'BLS Siri 1 2025');
    
    if (!siri1Session) {
      console.error('❌ BLS Siri 1 2025 course session not found. Please create it first.');
      return;
    }

    console.log('✅ Found course session:', siri1Session.full_name, 'ID:', siri1Session.id);

    // Assign all profiles to this course session
    const result = await ProfileService.assignAllProfilesToCourseSession(siri1Session.id);
    
    if (result.success) {
      console.log('✅ Assignment completed successfully!');
      console.log('📊 Statistics:', result.stats);
      console.log('📝 Message:', result.message);
    } else {
      console.error('❌ Assignment failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Assignment failed with error:', error);
  }
}

// You can call this function from anywhere in your app:
// import { assignAllToSiri1 } from './utils/assignToSiri1';
// assignAllToSiri1();
