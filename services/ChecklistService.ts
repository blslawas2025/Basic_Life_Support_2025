import { supabase } from './supabase';

export interface ChecklistItem {
  id?: string;
  title: string;
  description?: string;
  category: string;
  sub_items?: string[];
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface Checklist {
  id?: string;
  name: string;
  description?: string;
  category: string;
  items: ChecklistItem[];
  created_at?: string;
  updated_at?: string;
}

export class ChecklistService {
  // Create checklist table if it doesn't exist
  static async initializeTables() {
    try {
      // Create checklists table
      const { error: checklistsError } = await supabase.rpc('create_checklists_table_if_not_exists');
      if (checklistsError) {
        const { error } = await supabase.from('checklists').select('*').limit(1);
        if (error) {
          // Table doesn't exist, create it
          const createChecklistsTable = `
            CREATE TABLE IF NOT EXISTS checklists (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              category TEXT NOT NULL DEFAULT 'general',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          await supabase.rpc('exec_sql', { sql: createChecklistsTable });
        }
      }

      // Create checklist_items table
      const { error: itemsError } = await supabase.rpc('create_checklist_items_table_if_not_exists');
      if (itemsError) {
        const { error } = await supabase.from('checklist_items').select('*').limit(1);
        if (error) {
          // Table doesn't exist, create it
          const createItemsTable = `
            CREATE TABLE IF NOT EXISTS checklist_items (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              description TEXT,
              category TEXT NOT NULL DEFAULT 'general',
              sub_items JSONB,
              order_index INTEGER NOT NULL DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          await supabase.rpc('exec_sql', { sql: createItemsTable });
        }
      }
    } catch (error) {
      console.error('Error initializing checklist tables:', error);
    }
  }

  // Save checklist to database
  static async saveChecklist(checklist: Omit<Checklist, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; checklist?: Checklist; error?: string }> {
    try {
      // Initialize tables first
      await this.initializeTables();

      // Insert checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from('checklists')
        .insert({
          name: checklist.name,
          description: checklist.description,
          category: checklist.category
        })
        .select()
        .single();

      if (checklistError) {
        console.error('Error creating checklist:', checklistError);
        return { success: false, error: checklistError.message };
      }

      // Insert checklist items
      const itemsToInsert = checklist.items.map((item, index) => ({
        checklist_id: checklistData.id,
        title: item.title,
        description: item.description,
        category: item.category,
        sub_items: item.sub_items || [],
        order_index: index
      }));

      const { error: itemsError } = await supabase
        .from('checklist_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error creating checklist items:', itemsError);
        // Clean up the checklist if items failed
        await supabase.from('checklists').delete().eq('id', checklistData.id);
        return { success: false, error: itemsError.message };
      }

      // Fetch the complete checklist with items
      const { data: completeChecklist, error: fetchError } = await supabase
        .from('checklists')
        .select(`
          *,
          checklist_items (*)
        `)
        .eq('id', checklistData.id)
        .single();

      if (fetchError) {
        console.error('Error fetching complete checklist:', fetchError);
        return { success: false, error: fetchError.message };
      }

      return { 
        success: true, 
        checklist: {
          ...completeChecklist,
          items: completeChecklist.checklist_items || []
        }
      };

    } catch (error) {
      console.error('Error saving checklist:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get all checklists
  static async getAllChecklists(): Promise<{ success: boolean; checklists?: Checklist[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select(`
          *,
          checklist_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching checklists:', error);
        return { success: false, error: error.message };
      }

      const checklists: Checklist[] = data.map(checklist => ({
        ...checklist,
        items: checklist.checklist_items || []
      }));

      return { success: true, checklists };
    } catch (error) {
      console.error('Error fetching checklists:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get checklist by ID
  static async getChecklistById(id: string): Promise<{ success: boolean; checklist?: Checklist; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select(`
          *,
          checklist_items (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching checklist:', error);
        return { success: false, error: error.message };
      }

      const checklist: Checklist = {
        ...data,
        items: data.checklist_items || []
      };

      return { success: true, checklist };
    } catch (error) {
      console.error('Error fetching checklist:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Delete checklist
  static async deleteChecklist(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting checklist:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting checklist:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

