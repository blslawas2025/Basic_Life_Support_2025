# Course Sessions Implementation Guide

This guide explains how to implement the course sessions feature in your BLS app to handle different course sessions like "BLS Siri 1 2025", "BLS Siri 2 2025", etc.

## Overview

The course sessions feature allows you to:
- Create and manage different course sessions (e.g., BLS Siri 1 2025, BLS Siri 2 2025)
- Register participants for specific course sessions
- Track participant counts per session
- Filter and view participants by course session
- Manage course capacity and registration deadlines

## Database Changes

### 1. Create Course Sessions Table

Run the SQL migration in `database/create_course_sessions_table.sql`:

```sql
-- This creates the course_sessions table with all necessary fields
-- Includes sample data for 2025 BLS sessions
```

### 2. Add Course Session Reference to Profiles

Run the SQL migration in `database/add_course_session_to_profiles.sql`:

```sql
-- This adds course_session_id column to the profiles table
-- Links participants to specific course sessions
```

## New Files Created

### 1. Types and Interfaces (`types/CourseSession.ts`)
- `CourseSession` - Main interface for course session data
- `CreateCourseSession` - Interface for creating new sessions
- `UpdateCourseSession` - Interface for updating sessions
- `CourseSessionOption` - Interface for dropdown selections
- Helper functions for validation and formatting

### 2. Service Layer (`services/CourseSessionService.ts`)
- `CourseSessionService` class with methods for:
  - Creating, reading, updating course sessions
  - Getting active sessions (registration open)
  - Getting course session options for dropdowns
  - Searching and filtering sessions
  - Getting statistics and participant counts

### 3. Updated Profile Service (`services/ProfileService.ts`)
- Added `course_session_id` field to Profile interfaces
- New methods for:
  - Getting participants by course session
  - Getting course session statistics
  - Updating participant course sessions

## Updated Files

### 1. Registration Screen (`screens/RegisterParticipantScreen.tsx`)
- Added course session selection to the form
- New course session dropdown modal
- Updated form validation to require course session
- Updated profile creation to include course session data

### 2. Styles (`styles/RegisterParticipantStyles.ts`)
- Added styles for course session modal
- Added disabled state styles for unavailable sessions

## How to Use

### 1. Set Up Database
1. Run the SQL migrations in your Supabase database
2. The migrations will create sample course sessions for 2025

### 2. Create New Course Sessions
You can create new course sessions programmatically:

```typescript
import { CourseSessionService } from './services/CourseSessionService';

const newSession = await CourseSessionService.createCourseSession({
  course_name: 'BLS',
  series_name: 'Siri 4',
  year: 2025,
  description: 'Basic Life Support Training - Series 4 2025',
  start_date: '2025-03-15',
  end_date: '2025-03-16',
  registration_start_date: '2025-02-01',
  registration_end_date: '2025-03-10',
  max_participants: 30,
  status: 'active',
  is_registration_open: true
});
```

### 3. Register Participants
Participants can now select a course session during registration:
- The registration form includes a "Course Session" dropdown
- Only active sessions with available spots are shown
- Registration deadlines are displayed
- Participants are linked to their selected course session

### 4. View Participants by Course Session
You can filter participants by course session:

```typescript
import { ProfileService } from './services/ProfileService';

// Get all participants for a specific course session
const participants = await ProfileService.getParticipantsByCourseSession('session-id');

// Get participants by course session and status
const pendingParticipants = await ProfileService.getParticipantsByCourseSessionAndStatus(
  'session-id', 
  'pending'
);
```

## Features

### Course Session Management
- **Course Types**: BLS, ACLS, PALS, etc.
- **Series Management**: Siri 1, Siri 2, Siri 3, etc.
- **Year-based Organization**: 2025, 2026, etc.
- **Capacity Management**: Set max participants per session
- **Registration Windows**: Set registration start/end dates
- **Status Tracking**: Active, completed, cancelled, draft

### Participant Management
- **Session Assignment**: Link participants to specific sessions
- **Capacity Tracking**: Automatic participant count updates
- **Availability Checking**: Only show sessions with available spots
- **Deadline Management**: Show registration deadlines

### Data Integrity
- **Automatic Updates**: Participant counts update automatically
- **Validation**: Ensure participants can't register for full sessions
- **Deadline Enforcement**: Prevent registration after deadlines
- **Status Management**: Track session and participant statuses

## Example Course Sessions

The system comes with sample course sessions:
- **BLS Siri 1 2025** - July 15-16, 2025 (30 spots)
- **BLS Siri 2 2025** - October 15-16, 2025 (30 spots)  
- **BLS Siri 3 2025** - December 15-16, 2025 (30 spots)

## Next Steps

1. **Run the database migrations** to set up the tables
2. **Test the registration flow** with course session selection
3. **Create additional course sessions** as needed
4. **Update other screens** to filter by course session (ViewParticipantsScreen, etc.)
5. **Add course session management** for admins to create/edit sessions

## Benefits

- **Clear Organization**: Participants are clearly separated by course session
- **Capacity Management**: Prevent overbooking of sessions
- **Better Reporting**: Generate reports by course session
- **Flexible Scheduling**: Easy to add new sessions and series
- **Data Integrity**: Automatic validation and updates
- **User Experience**: Clear course session selection with availability info

This implementation provides a solid foundation for managing multiple course sessions while maintaining data integrity and providing a good user experience.
