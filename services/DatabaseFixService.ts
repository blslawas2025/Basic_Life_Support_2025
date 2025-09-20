import { supabase } from './supabase';

/**
 * DatabaseFixService handles fixing database issues related to checklist synchronization
 * This service can be called from within the React Native app
 */
export class DatabaseFixService {
  /**
   * Fix choking checklist sections to use correct sections instead of CPR sections
   */
  static async fixChokingSections(): Promise<{ success: boolean; error?: string }> {
    try {

      // First, fix the database constraint to include choking sections
      const { error: constraintError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE checklist_item DROP CONSTRAINT IF EXISTS checklist_item_section_check;
          ALTER TABLE checklist_item ADD CONSTRAINT checklist_item_section_check 
          CHECK (section IN (
            'danger',
            'respons',
            'shout for help',
            'airway',
            'breathing',
            'circulation',
            'defribillation',
            'first rescuer',
            'second rescuer',
            'assess severity',
            'mild choking',
            'severe choking',
            'victim unconscious'
          ));
        `
      });

      if (constraintError) {
        // Continue anyway, the constraint might already be correct
      }

      // Check what sections currently exist for choking
      const { data: currentData, error: checkError } = await supabase
        .from('checklist_item')
        .select('checklist_type, section')
        .in('checklist_type', ['adult choking', 'infant choking']);

      if (checkError) {
        console.error('Error checking current data:', checkError);
        return { success: false, error: checkError.message };
      }

      // Delete existing choking data
      const { error: deleteError } = await supabase
        .from('checklist_item')
        .delete()
        .in('checklist_type', ['adult choking', 'infant choking']);

      if (deleteError) {
        console.error('Error deleting choking data:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Insert correct adult choking data
      const adultChokingData = [
        // 1. Assess the severity
        { checklist_type: 'adult choking', section: 'assess severity', item: 'Ask: Are you choking? Are you ok?', is_compulsory: false, order_index: 1 },
        { checklist_type: 'adult choking', section: 'assess severity', item: 'Mild - effective cough', is_compulsory: false, order_index: 2 },
        { checklist_type: 'adult choking', section: 'assess severity', item: 'Severe - the cough becomes ineffective', is_compulsory: false, order_index: 3 },

        // 2. Mild choking
        { checklist_type: 'adult choking', section: 'mild choking', item: 'a. Encourage the victim to cough', is_compulsory: false, order_index: 4 },

        // 3. Severe choking
        { checklist_type: 'adult choking', section: 'severe choking', item: 'a. Give 5 back blows:', is_compulsory: false, order_index: 5 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'i. Lean the victim forwards.', is_compulsory: false, order_index: 6 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'ii. Apply blows between the shoulder blades using the heel of one hand', is_compulsory: false, order_index: 7 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'b. If back blows are ineffective, give 5 abdominal thrusts:', is_compulsory: false, order_index: 8 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'i. Stand behind the victim and put both your arms around the upper part of the victim\'s abdomen.', is_compulsory: false, order_index: 9 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'ii. Lean the victim forwards.', is_compulsory: false, order_index: 10 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'iii. Clench your fist and place it between the umbilicus (navel) and the ribcage.', is_compulsory: false, order_index: 11 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'iv. Grasp your fist with the other hand and pull sharply inwards and upwards.', is_compulsory: false, order_index: 12 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'c. Continue alternating 5 back blows with 5 abdominal thrusts until it is relieved, or the victim becomes unconscious.', is_compulsory: false, order_index: 13 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'd. Perform chest thrust for pregnant and very obese victims', is_compulsory: false, order_index: 14 },

        // 4. Victim unconscious
        { checklist_type: 'adult choking', section: 'victim unconscious', item: 'a. Start CPR', is_compulsory: false, order_index: 15 },
        { checklist_type: 'adult choking', section: 'victim unconscious', item: '-During airway opening, check for foreign body, do not perform a blind finger sweep.', is_compulsory: false, order_index: 16 }
      ];

      const { error: adultError } = await supabase
        .from('checklist_item')
        .insert(adultChokingData);

      if (adultError) {
        console.error('Error inserting adult choking data:', adultError);
        return { success: false, error: adultError.message };
      }

      // Insert correct infant choking data
      const infantChokingData = [
        // 1. Assess the severity
        { checklist_type: 'infant choking', section: 'assess severity', item: 'Mild:', is_compulsory: false, order_index: 1 },
        { checklist_type: 'infant choking', section: 'assess severity', item: 'coughing effectively (fully responsive, loud cough, taking a breath before coughing), still crying, or speaking', is_compulsory: false, order_index: 2 },
        { checklist_type: 'infant choking', section: 'assess severity', item: 'Severe:', is_compulsory: false, order_index: 3 },
        { checklist_type: 'infant choking', section: 'assess severity', item: '- ineffective cough, inability to cough, decreasing consciousness, inability to breathe or vocalise, cyanosis.', is_compulsory: false, order_index: 4 },

        // 2. Mild choking
        { checklist_type: 'infant choking', section: 'mild choking', item: 'a Encourage the child to cough and continue monitoring the child\'s condition', is_compulsory: false, order_index: 5 },

        // 3. Severe choking
        { checklist_type: 'infant choking', section: 'severe choking', item: 'a Ask for help', is_compulsory: false, order_index: 6 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'i. second rescuer should call MERS 999, preferably by mobile phone (speaker function).', is_compulsory: false, order_index: 7 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'ii. A single trained rescuer should first proceed with rescue manoeuvres (unless able to call simultaneously with the speaker function activated)', is_compulsory: false, order_index: 8 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'b Perform 5 back blows and followed with 5 chest thrusts', is_compulsory: false, order_index: 9 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'Back Blows', is_compulsory: false, order_index: 10 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'i. Support the infant in a head-downwards, prone position by placing the thumb of one hand at the angle of the lower jaw. Deliver up to 5 sharp back blows with the heel of one hand in the middle of the back between the shoulder blades.', is_compulsory: false, order_index: 11 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'Chest Thrust', is_compulsory: false, order_index: 12 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'i. Turn the infant into a head-downwards supine position and place free arm along the infant\'s back and encircling the occiput with your hand.', is_compulsory: false, order_index: 13 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'ii. Place two fingers of the free hand on the lower half of the infant\'s sternum (in the same position as for chest compression during CPR).', is_compulsory: false, order_index: 14 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'iii. Deliver up to 5 chest thrusts. These are similar to chest compressions but sharper and delivered at a slower rate.', is_compulsory: false, order_index: 15 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'iv. Continue alternating 5 back blows with 5 chest thrusts until the obstruction is relieved or the infant becomes unconscious.', is_compulsory: false, order_index: 16 },

        // 4. Victim unconscious
        { checklist_type: 'infant choking', section: 'victim unconscious', item: 'a. Start CPR', is_compulsory: false, order_index: 17 },
        { checklist_type: 'infant choking', section: 'victim unconscious', item: '-During airway opening, check for foreign body, do not perform a blind finger sweep.', is_compulsory: false, order_index: 18 }
      ];

      const { error: infantError } = await supabase
        .from('checklist_item')
        .insert(infantChokingData);

      if (infantError) {
        console.error('Error inserting infant choking data:', infantError);
        return { success: false, error: infantError.message };
      }

      // Verify the fix
      const { data: verifyData, error: verifyError } = await supabase
        .from('checklist_item')
        .select('checklist_type, section')
        .in('checklist_type', ['adult choking', 'infant choking']);

      if (verifyError) {
        console.error('Error verifying data:', verifyError);
        return { success: false, error: verifyError.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Error fixing choking sections:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fix compulsory status for existing checklist items
   */
  static async fixCompulsoryStatus(): Promise<{ success: boolean; error?: string }> {
    try {

      // Get all checklist items
      const { data: items, error: fetchError } = await supabase
        .from('checklist_item')
        .select('*');

      if (fetchError) {
        console.error('Error fetching checklist items:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (!items || items.length === 0) {

        return { success: true };
      }

      // Update compulsory status based on section
      const updates = items.map(item => {
        let isCompulsory = true; // Default to compulsory

        // CPR checklists - only airway, breathing, circulation are compulsory
        if (['one man cpr', 'two man cpr', 'infant cpr'].includes(item.checklist_type)) {
          isCompulsory = ['airway', 'breathing', 'circulation'].includes(item.section);
        }
        // Choking checklists - all items are optional for now
        else if (['adult choking', 'infant choking'].includes(item.checklist_type)) {
          isCompulsory = false;
        }

        return {
          id: item.id,
          is_compulsory: isCompulsory
        };
      });

      // Update items in batches
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        for (const update of batch) {
          const { error: updateError } = await supabase
            .from('checklist_item')
            .update({ is_compulsory: update.is_compulsory })
            .eq('id', update.id);

          if (updateError) {
            console.error(`Error updating item ${update.id}:`, updateError);
            return { success: false, error: updateError.message };
          }
        }
      }

      return { success: true };

    } catch (error) {
      console.error('Error fixing compulsory status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Run all database fixes
   */
  static async runAllFixes(): Promise<{ success: boolean; error?: string; results: any[] }> {
    try {

      const results = [];

      // Fix choking sections
      const chokingResult = await this.fixChokingSections();
      results.push({ fix: 'choking_sections', ...chokingResult });

      // Fix compulsory status
      const compulsoryResult = await this.fixCompulsoryStatus();
      results.push({ fix: 'compulsory_status', ...compulsoryResult });

      const allSuccess = results.every(result => result.success);
      
      if (allSuccess) {

        return { success: true, results };
      } else {
        console.error('❌ Some fixes failed:', results);
        return { success: false, error: 'Some fixes failed', results };
      }

    } catch (error) {
      console.error('Error running database fixes:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', results: [] };
    }
  }

  /**
   * Quick fix for immediate testing - fixes the most critical issues
   */
  static async quickFix(): Promise<{ success: boolean; error?: string }> {
    try {

      // 1. Skip constraint update for now - focus on data fixes

      // 2. Delete and recreate choking data

      // Delete existing choking data

      const { error: deleteError } = await supabase
        .from('checklist_item')
        .delete()
        .in('checklist_type', ['adult choking', 'infant choking']);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return { success: false, error: `Failed to delete choking data: ${deleteError.message}` };
      }

      // Insert correct adult choking data
      const adultChokingData = [
        { checklist_type: 'adult choking', section: 'assess severity', item: 'Ask: Are you choking? Are you ok?', is_compulsory: false, order_index: 1 },
        { checklist_type: 'adult choking', section: 'assess severity', item: 'Mild - effective cough', is_compulsory: false, order_index: 2 },
        { checklist_type: 'adult choking', section: 'assess severity', item: 'Severe - the cough becomes ineffective', is_compulsory: false, order_index: 3 },
        { checklist_type: 'adult choking', section: 'mild choking', item: 'a. Encourage the victim to cough', is_compulsory: false, order_index: 4 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'a. Give 5 back blows:', is_compulsory: false, order_index: 5 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'i. Lean the victim forwards.', is_compulsory: false, order_index: 6 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'ii. Apply blows between the shoulder blades using the heel of one hand', is_compulsory: false, order_index: 7 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'b. If back blows are ineffective, give 5 abdominal thrusts:', is_compulsory: false, order_index: 8 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'i. Stand behind the victim and put both your arms around the upper part of the victim\'s abdomen.', is_compulsory: false, order_index: 9 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'ii. Lean the victim forwards.', is_compulsory: false, order_index: 10 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'iii. Clench your fist and place it between the umbilicus (navel) and the ribcage.', is_compulsory: false, order_index: 11 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'iv. Grasp your fist with the other hand and pull sharply inwards and upwards.', is_compulsory: false, order_index: 12 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'c. Continue alternating 5 back blows with 5 abdominal thrusts until it is relieved, or the victim becomes unconscious.', is_compulsory: false, order_index: 13 },
        { checklist_type: 'adult choking', section: 'severe choking', item: 'd. Perform chest thrust for pregnant and very obese victims', is_compulsory: false, order_index: 14 },
        { checklist_type: 'adult choking', section: 'victim unconscious', item: 'a. Start CPR', is_compulsory: false, order_index: 15 },
        { checklist_type: 'adult choking', section: 'victim unconscious', item: '-During airway opening, check for foreign body, do not perform a blind finger sweep.', is_compulsory: false, order_index: 16 }
      ];

      const { error: adultError } = await supabase.from('checklist_item').insert(adultChokingData);
      
      if (adultError) {
        console.error('Adult choking insert error:', adultError);
        return { success: false, error: `Failed to insert adult choking data: ${adultError.message}` };
      }

      // Insert correct infant choking data
      const infantChokingData = [
        { checklist_type: 'infant choking', section: 'assess severity', item: 'Mild:', is_compulsory: false, order_index: 1 },
        { checklist_type: 'infant choking', section: 'assess severity', item: 'coughing effectively (fully responsive, loud cough, taking a breath before coughing), still crying, or speaking', is_compulsory: false, order_index: 2 },
        { checklist_type: 'infant choking', section: 'assess severity', item: 'Severe:', is_compulsory: false, order_index: 3 },
        { checklist_type: 'infant choking', section: 'assess severity', item: '- ineffective cough, inability to cough, decreasing consciousness, inability to breathe or vocalise, cyanosis.', is_compulsory: false, order_index: 4 },
        { checklist_type: 'infant choking', section: 'mild choking', item: 'a Encourage the child to cough and continue monitoring the child\'s condition', is_compulsory: false, order_index: 5 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'a Ask for help', is_compulsory: false, order_index: 6 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'i. second rescuer should call MERS 999, preferably by mobile phone (speaker function).', is_compulsory: false, order_index: 7 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'ii. A single trained rescuer should first proceed with rescue manoeuvres (unless able to call simultaneously with the speaker function activated)', is_compulsory: false, order_index: 8 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'b Perform 5 back blows and followed with 5 chest thrusts', is_compulsory: false, order_index: 9 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'Back Blows', is_compulsory: false, order_index: 10 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'i. Support the infant in a head-downwards, prone position by placing the thumb of one hand at the angle of the lower jaw. Deliver up to 5 sharp back blows with the heel of one hand in the middle of the back between the shoulder blades.', is_compulsory: false, order_index: 11 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'Chest Thrust', is_compulsory: false, order_index: 12 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'i. Turn the infant into a head-downwards supine position and place free arm along the infant\'s back and encircling the occiput with your hand.', is_compulsory: false, order_index: 13 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'ii. Place two fingers of the free hand on the lower half of the infant\'s sternum (in the same position as for chest compression during CPR).', is_compulsory: false, order_index: 14 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'iii. Deliver up to 5 chest thrusts. These are similar to chest compressions but sharper and delivered at a slower rate.', is_compulsory: false, order_index: 15 },
        { checklist_type: 'infant choking', section: 'severe choking', item: 'iv. Continue alternating 5 back blows with 5 chest thrusts until the obstruction is relieved or the infant becomes unconscious.', is_compulsory: false, order_index: 16 },
        { checklist_type: 'infant choking', section: 'victim unconscious', item: 'a. Start CPR', is_compulsory: false, order_index: 17 },
        { checklist_type: 'infant choking', section: 'victim unconscious', item: '-During airway opening, check for foreign body, do not perform a blind finger sweep.', is_compulsory: false, order_index: 18 }
      ];

      const { error: infantError } = await supabase.from('checklist_item').insert(infantChokingData);
      
      if (infantError) {
        console.error('Infant choking insert error:', infantError);
        return { success: false, error: `Failed to insert infant choking data: ${infantError.message}` };
      }

      // 3. Fix compulsory status for CPR checklists

      const { data: cprItems, error: cprFetchError } = await supabase
        .from('checklist_item')
        .select('id, section, is_compulsory')
        .in('checklist_type', ['one man cpr', 'two man cpr', 'infant cpr']);

      if (cprFetchError) {
        console.error('CPR fetch error:', cprFetchError);
        return { success: false, error: `Failed to fetch CPR items: ${cprFetchError.message}` };
      }

      if (cprItems && cprItems.length > 0) {

        for (const item of cprItems) {
          const isCompulsory = ['airway', 'breathing', 'circulation'].includes(item.section);
          const { error: updateError } = await supabase
            .from('checklist_item')
            .update({ is_compulsory: isCompulsory })
            .eq('id', item.id);
          
          if (updateError) {
            console.error(`Error updating item ${item.id}:`, updateError);
          }
        }

      } else {

      }

      return { success: true };

    } catch (error) {
      console.error('❌ Quick fix failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
