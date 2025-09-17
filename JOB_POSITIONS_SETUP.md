# Jobs Table Setup for Basic Life Support App

This document provides instructions for setting up the jobs table in Supabase for your Basic Life Support application.

## Overview

The jobs table stores all healthcare job positions with their corresponding grades and code prefixes that can be assigned to participants in the Basic Life Support system. It includes 15 predefined positions covering various healthcare roles with detailed grade structures.

## Files Created

1. **`supabase_jobs_updated.sql`** - Updated SQL script with grades and code prefixes
2. **`types/JobPosition.ts`** - TypeScript interfaces for type safety
3. **`services/supabase.ts`** - Service functions for database operations
4. **`config/supabase.ts`** - Configuration file for Supabase settings

## Setup Instructions

### 1. Install Dependencies

First, install the Supabase client library:

```bash
npm install @supabase/supabase-js
```

### 2. Set up Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Navigate to your project dashboard
3. Go to Settings > API
4. Copy your Project URL and anon/public key

### 3. Configure Environment Variables

Create a `.env` file in your project root with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Or update the values directly in `config/supabase.ts`.

### 4. Create the Table

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase_jobs_updated.sql`
4. Run the SQL script

This will:
- Create the `jobs` table with grades and code prefixes
- Insert all 15 job positions with their grade structures
- Set up proper indexes and triggers
- Configure Row Level Security (RLS) policies
- Create database functions and views for advanced querying

## Table Structure

The `jobs` table includes:

- **id** (UUID) - Primary key
- **name** (VARCHAR) - The job title (e.g., "Pegawai Perubatan")
- **code_prefix** (VARCHAR) - Code prefix (e.g., "UD", "UF", "U", "N", "H", "JA")
- **grades** (JSONB) - Array of available grades for this position
- **category** (VARCHAR) - Job category (Clinical, Non-Clinical)
- **notes** (TEXT) - Additional notes about the position
- **is_active** (BOOLEAN) - Whether the position is active
- **created_at** (TIMESTAMP) - Creation timestamp
- **updated_at** (TIMESTAMP) - Last update timestamp

## Predefined Job Positions

The table comes pre-populated with these 15 positions and their grade structures:

### Clinical Officers
1. **Pegawai Perubatan** (UD) - Grades: UD9, UD10, UD12, UD13, UD14, UD15 (UD15 = pakar)
2. **Pegawai Farmasi** (UF) - Grades: UF9, UF10, UF12, UF13, UF14
3. **Pegawai Pergigian** (UG) - Grades: UG9, UG10, UG12, UG13, UG14, UG15 (UG15 = pakar)

### Allied Health (Clinical)
4. **Penolong Pegawai Perubatan** (U) - Grades: U5, U6, U7, U9, U10, U12, U13, U14
5. **Jururawat** (U) - Grades: U5, U6, U7, U9, U10, U12, U13, U14
6. **Penolong Pegawai Farmasi** (U) - Grades: U5, U6, U7, U8
7. **Juruteknologi Makmal Perubatan** (U) - Grades: U5, U6, U7, U8
8. **Jurupulih Perubatan Carakerja** (U) - Grades: U5, U6, U7, U8
9. **Jurupulih Fisioterapi** (U) - Grades: U5, U6, U7, U8
10. **Juru-Xray** (U) - Grades: U5, U6, U7, U9, U10, U12, U13, U14 (Diagnostik/Pengimejan)
11. **Pembantu Perawatan Kesihatan** (U) - Grades: U1, U2, U3, U4
12. **Jururawat Masyarakat** (U) - Grades: U1, U2, U3, U4
13. **Pembantu Pembedahan Pergigian** (U) - Grades: U1, U2, U3, U4

### Non-Clinical / Support
14. **Penolong Pegawai Tadbir** (N) - Grades: N5, N6, N7, N8
15. **Pembantu Tadbir** (N) - Grades: N1, N2, N3, N4 (Perkeranian/Operasi)
16. **Pembantu Khidmat Am** (H) - Grades: H1, H2, H3, H4
17. **Penolong Jurutera** (JA) - Grades: JA5, JA6, JA7, JA8
18. **Pembantu Penyediaan Makanan** (N) - Grades: N1, N2, N3, N4

## Usage in Your App

### Import the Service

```typescript
import { JobService } from './services/supabase';
import { Job, JobCategory, CodePrefix } from './types/JobPosition';
```

### Get All Jobs

```typescript
const jobs = await JobService.getAllJobs();
```

### Get Jobs by Category

```typescript
const clinicalJobs = await JobService.getJobsByCategory(JobCategory.CLINICAL);
const nonClinicalJobs = await JobService.getJobsByCategory(JobCategory.NON_CLINICAL);
```

### Get Jobs by Code Prefix

```typescript
const udJobs = await JobService.getJobsByCodePrefix(CodePrefix.UD); // Medical Officers
const uJobs = await JobService.getJobsByCodePrefix(CodePrefix.U);   // Allied Health
```

### Get Jobs by Grade

```typescript
const u5Jobs = await JobService.getJobsByGrade('U5');
const ud15Jobs = await JobService.getJobsByGrade('UD15'); // Specialist positions
```

### Get All Job Grades

```typescript
const allGrades = await JobService.getAllJobGrades();
```

### Search Jobs

```typescript
const searchResults = await JobService.searchJobs('Jururawat');
```

### Create New Job

```typescript
const newJob = await JobService.createJob({
  name: 'New Position',
  code_prefix: CodePrefix.U,
  grades: ['U5', 'U6', 'U7'],
  category: JobCategory.CLINICAL,
  notes: 'Description of the new position'
});
```

### Check Grade Validity

```typescript
const isValid = await JobService.isGradeValidForJob(jobId, 'U5');
```

### Category Management

```typescript
// Get available categories with job counts
const categories = await JobService.getAvailableCategories();

// Change a single job's category
const success = await JobService.changeJobCategory(jobId, JobCategory.NON_CLINICAL);

// Bulk change categories for multiple jobs
const updatedCount = await JobService.bulkChangeJobCategories(
  [jobId1, jobId2, jobId3], 
  JobCategory.CLINICAL
);

// Update job category using standard update method
const updatedJob = await JobService.updateJobCategory(jobId, JobCategory.CLINICAL);

// Get jobs by category with additional filtering
const clinicalUJobs = await JobService.getJobsByCategoryWithFilter(
  JobCategory.CLINICAL, 
  CodePrefix.U
);

// Get category statistics
const categoryStats = await JobService.getCategoryStats();
```

### Using the Job Category Manager Component

```typescript
import JobCategoryManager from './components/JobCategoryManager';

// In your screen component
<JobCategoryManager 
  onCategoryChanged={() => {
    // Handle category change callback
    console.log('Job categories updated');
  }}
/>
```

## Security

The table is configured with Row Level Security (RLS) policies that:
- Allow authenticated users to read job positions
- Allow authenticated users to create, update, and delete job positions
- Ensure data security and proper access control

## Next Steps

1. Run the SQL script in your Supabase project
2. Update your Supabase configuration
3. Test the service functions in your app
4. Integrate job position selection into your participant management screens

## Troubleshooting

- Ensure your Supabase project is properly configured
- Check that environment variables are correctly set
- Verify that RLS policies are enabled
- Check the Supabase logs for any errors

For more information, refer to the [Supabase documentation](https://supabase.com/docs).
