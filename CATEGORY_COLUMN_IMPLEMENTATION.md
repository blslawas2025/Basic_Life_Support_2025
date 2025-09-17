# Category Column Implementation for Profiles Table

## Overview
This implementation adds a `category` column to the `profiles` table that automatically fills with 'Clinical' or 'Non-Clinical' based on the related job position from the `jobs` table.

## Database Changes

### 1. New Column
- **Column Name**: `category`
- **Data Type**: `VARCHAR(50)`
- **Constraints**: `CHECK (category IN ('Clinical', 'Non-Clinical'))`
- **Nullable**: Yes (can be NULL if no job position is assigned)

### 2. Automatic Filling
The category is automatically filled through database triggers:

#### Triggers Created:
- `set_profile_category_on_insert`: Fires before INSERT operations
- `set_profile_category_on_update`: Fires before UPDATE operations

#### Function:
- `set_profile_category()`: Automatically sets the category based on `job_position_id`

### 3. Helper Functions

#### `update_profile_category(profile_id UUID)`
- Manually updates the category for a specific profile
- Returns `TRUE` if successful, `FALSE` if no job found

#### `update_all_profiles_categories()`
- Updates all existing profiles with their job categories
- Returns the number of updated profiles

### 4. Database View
- **View Name**: `profiles_with_categories`
- **Purpose**: Easy querying of profiles with job information and categories
- **Columns**: All profile columns plus job name, job category, and job code prefix

## TypeScript Interface Updates

### Profile Interface
The `Profile` interface in `services/ProfileService.ts` has been updated to include:
```typescript
category: 'Clinical' | 'Non-Clinical' | null; // Automatically filled from jobs table
```

### Note on CreateProfile and UpdateProfile
These interfaces do **NOT** include the category field since it's automatically managed by the database triggers.

## Usage Examples

### 1. Creating a New Profile
```typescript
const newProfile: CreateProfile = {
  email: "nurse@hospital.com",
  name: "Jane Doe",
  job_position_id: "some-uuid", // This will automatically set category
  // ... other fields
};
```

### 2. Querying Profiles by Category
```sql
-- Get all clinical staff
SELECT * FROM profiles WHERE category = 'Clinical';

-- Get all non-clinical staff
SELECT * FROM profiles WHERE category = 'Non-Clinical';

-- Get profiles with their job categories
SELECT * FROM profiles_with_categories;
```

### 3. Manual Category Update
```sql
-- Update a specific profile's category
SELECT update_profile_category('profile-uuid-here');

-- Update all profiles' categories
SELECT update_all_profiles_categories();
```

## Job Categories Mapping

Based on the `jobs` table, the categories are mapped as follows:

### Clinical Jobs:
- Pegawai Perubatan (Medical Officer)
- Pegawai Farmasi (Pharmacy Officer)
- Pegawai Pergigian (Dental Officer)
- Penolong Pegawai Perubatan (Assistant Medical Officer)
- Jururawat (Nurse)
- Penolong Pegawai Farmasi (Assistant Pharmacy Officer)
- Juruteknologi Makmal Perubatan (Medical Laboratory Technologist)
- Jurupulih Perubatan Carakerja (Occupational Therapist)
- Jurupulih Fisioterapi (Physiotherapist)
- Juru-Xray (X-ray Technician)
- Pembantu Perawatan Kesihatan (Healthcare Assistant)
- Jururawat Masyarakat (Community Health Nurse)
- Pembantu Pembedahan Pergigian (Dental Assistant)

### Non-Clinical Jobs:
- Penolong Pegawai Tadbir (Assistant Administrative Officer)
- Pembantu Tadbir (Administrative Assistant)
- Pembantu Khidmat Am (General Services Assistant)
- Penolong Jurutera (Assistant Engineer)
- Pembantu Penyediaan Makanan (Food Preparation Assistant)

## Testing

Use the `test_category_implementation.sql` script to verify:
1. Column exists and has correct constraints
2. Triggers are properly created
3. Automatic filling works on insert/update
4. Helper functions work correctly
5. View returns expected data

## Migration Steps

1. Run `add_category_column_to_profiles.sql` to add the column and triggers
2. Run `test_category_implementation.sql` to verify the implementation
3. Update your TypeScript interfaces (already done)
4. Test the functionality in your application

## Benefits

1. **Automatic Data Consistency**: Category is always in sync with job position
2. **No Manual Updates**: Reduces human error in category assignment
3. **Easy Querying**: Simple filtering by clinical/non-clinical status
4. **Backward Compatible**: Existing code continues to work
5. **Performance**: Indexed column for fast queries
