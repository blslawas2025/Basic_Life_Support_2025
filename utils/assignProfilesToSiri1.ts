// Utility function to assign all profiles with user roles to BLS Siri 1 2025
// This can be run from your app or as a standalone script

import { ProfileService } from '../services/ProfileService';
import { CourseSessionService } from '../services/CourseSessionService';

export async function assignAllProfilesToSiri1(): Promise<{
  success: boolean;
  message: string;
  stats: {
    totalProfiles: number;
    updatedProfiles: number;
    errorCount: number;
    breakdown: Record<string, number>;
  };
}> {
  try {
    console.log('🚀 Starting profile assignment to BLS Siri 1 2025...');
    
    // Get the BLS Siri 1 2025 course session
    const courseSessions = await CourseSessionService.getAllCourseSessions();
    const siri1Session = courseSessions.find(session => session.full_name === 'BLS Siri 1 2025');
    
    if (!siri1Session) {
      return {
        success: false,
        message: 'BLS Siri 1 2025 course session not found. Please create it first.',
        stats: {
          totalProfiles: 0,
          updatedProfiles: 0,
          errorCount: 0,
          breakdown: {}
        }
      };
    }

    console.log('✅ Found course session:', siri1Session.full_name, 'ID:', siri1Session.id);

    // Get all profiles with user roles
    const allProfiles = await ProfileService.getAllProfiles();
    const userProfiles = allProfiles.filter(profile => 
      ['participant', 'staff', 'admin', 'super_admin'].includes(profile.user_type)
    );

    console.log(`📊 Found ${userProfiles.length} profiles with user roles`);

    // Filter profiles that don't already have a course session
    const profilesToUpdate = userProfiles.filter(profile => !profile.course_session_id);
    console.log(`🔄 ${profilesToUpdate.length} profiles need course session assignment`);

    if (profilesToUpdate.length === 0) {
      return {
        success: true,
        message: 'All profiles already have course sessions assigned',
        stats: {
          totalProfiles: userProfiles.length,
          updatedProfiles: 0,
          errorCount: 0,
          breakdown: {}
        }
      };
    }

    // Update profiles
    let updatedCount = 0;
    let errorCount = 0;
    const breakdown: Record<string, number> = {};

    for (const profile of profilesToUpdate) {
      try {
        await ProfileService.updateProfile(profile.id, {
          course_session_id: siri1Session.id
        });
        
        console.log(`✅ Updated: ${profile.name} (${profile.user_type})`);
        updatedCount++;
        breakdown[profile.user_type] = (breakdown[profile.user_type] || 0) + 1;
      } catch (error) {
        console.error(`❌ Error updating profile ${profile.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n🎉 Assignment completed!');
    console.log(`✅ Successfully updated: ${updatedCount} profiles`);
    console.log(`❌ Errors: ${errorCount} profiles`);

    return {
      success: true,
      message: `Successfully assigned ${updatedCount} profiles to BLS Siri 1 2025`,
      stats: {
        totalProfiles: userProfiles.length,
        updatedProfiles: updatedCount,
        errorCount: errorCount,
        breakdown: breakdown
      }
    };

  } catch (error) {
    console.error('❌ Assignment failed:', error);
    return {
      success: false,
      message: `Assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: {
        totalProfiles: 0,
        updatedProfiles: 0,
        errorCount: 0,
        breakdown: {}
      }
    };
  }
}

// Function to run the assignment (can be called from anywhere in your app)
export async function runProfileAssignment(): Promise<void> {
  const result = await assignAllProfilesToSiri1();
  
  if (result.success) {
    console.log('✅ Assignment successful!');
    console.log('📊 Statistics:', result.stats);
  } else {
    console.error('❌ Assignment failed:', result.message);
  }
}
