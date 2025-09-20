import { supabase } from './supabase';
import { checklistStateManager } from './ChecklistStateManager';

export interface ChecklistItemData {
  id?: string;
  checklist_type: 'one man cpr' | 'two man cpr' | 'infant cpr' | 'adult choking' | 'infant choking';
  section: string; // Dynamic section based on checklist type
  item: string;
  is_compulsory: boolean;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export class ChecklistItemService {
  // Get valid sections for each checklist type
  static getValidSections(checklistType: string): string[] {
    switch (checklistType) {
      case 'one man cpr':
      case 'two man cpr':
      case 'infant cpr':
        return ['danger', 'respons', 'shout for help', 'airway', 'breathing', 'circulation', 'defribillation'];
      case 'adult choking':
        return ['assess severity', 'mild choking', 'severe choking', 'victim unconscious'];
      case 'infant choking':
        return ['assess severity', 'mild choking', 'severe choking', 'victim unconscious'];
      default:
        return [];
    }
  }

  // Initialize the checklist_item table
  static async initializeTable() {
    try {
      const { error } = await supabase.from('checklist_item').select('*').limit(1);
      if (error) {

        const createTable = `
          CREATE TABLE IF NOT EXISTS checklist_item (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            checklist_type TEXT NOT NULL CHECK (checklist_type IN (
              'one man cpr',
              'two man cpr', 
              'infant cpr',
              'adult choking',
              'infant choking'
            )),
            section TEXT NOT NULL CHECK (section IN (
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
            )),
            item TEXT NOT NULL,
            is_compulsory BOOLEAN NOT NULL DEFAULT false,
            order_index INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;
        await supabase.rpc('exec_sql', { sql: createTable });
      }

    } catch (error) {
      console.error('Error initializing checklist_item table:', error);
    }
  }

  // Create Two Man CPR checklist
  static async createTwoManCPRChecklist(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initializeTable();

      const twoManCPRItems: Omit<ChecklistItemData, 'id' | 'created_at' | 'updated_at'>[] = [
        // DANGER section
        {
          checklist_type: 'two man cpr',
          section: 'danger',
          item: 'Wear PPE (gloves, apron, mask), look out for blood spills, sharps, electric wires. Unsteady beds, trolley',
          is_compulsory: false,
          order_index: 1
        },
        
        // RESPONSE section
        {
          checklist_type: 'two man cpr',
          section: 'respons',
          item: 'Shoulder tap',
          is_compulsory: false,
          order_index: 2
        },
        {
          checklist_type: 'two man cpr',
          section: 'respons',
          item: 'Shout & speak "are you okay?"',
          is_compulsory: false,
          order_index: 3
        },
        
        // SHOUT FOR HELP section
        {
          checklist_type: 'two man cpr',
          section: 'shout for help',
          item: 'For IHCA - Shout "Emergency! Emergency! Bring the resuscitation trolley and defibrillator/AED!"',
          is_compulsory: false,
          order_index: 4
        },
        
        // AIRWAY section
        {
          checklist_type: 'two man cpr',
          section: 'airway',
          item: 'Head Tilt Chin Lift',
          is_compulsory: true,
          order_index: 5
        },
        {
          checklist_type: 'two man cpr',
          section: 'airway',
          item: 'Jaw Thrust',
          is_compulsory: true,
          order_index: 6
        },
        
        // BREATHING section
        {
          checklist_type: 'two man cpr',
          section: 'breathing',
          item: 'Determine while opening the airway by looking at the chest, in not more than 10 seconds (and if you are trained, simultaneously feel for the presence of pulse)',
          is_compulsory: true,
          order_index: 7
        },
        {
          checklist_type: 'two man cpr',
          section: 'breathing',
          item: 'Chest compression shall begin with absence of normal breathing or no pulse',
          is_compulsory: true,
          order_index: 8
        },
        
        // CIRCULATION section (1st Rescuer)
        {
          checklist_type: 'two man cpr',
          section: 'circulation',
          item: 'Location - middle of chest, lower half of sternum',
          is_compulsory: true,
          order_index: 9
        },
        {
          checklist_type: 'two man cpr',
          section: 'circulation',
          item: 'Rate of compression: 100-120/min',
          is_compulsory: true,
          order_index: 10
        },
        {
          checklist_type: 'two man cpr',
          section: 'circulation',
          item: 'Depth of compression: 5-6 cm',
          is_compulsory: true,
          order_index: 11
        },
        {
          checklist_type: 'two man cpr',
          section: 'circulation',
          item: 'Full recoil after each compression',
          is_compulsory: true,
          order_index: 12
        },
        {
          checklist_type: 'two man cpr',
          section: 'circulation',
          item: 'Minimize Interruption',
          is_compulsory: true,
          order_index: 13
        },
        {
          checklist_type: 'two man cpr',
          section: 'circulation',
          item: 'Compressions to ventilations ratio, 30:2',
          is_compulsory: true,
          order_index: 14
        },
        {
          checklist_type: 'two man cpr',
          section: 'circulation',
          item: 'Each ventilation in 1 second',
          is_compulsory: true,
          order_index: 15
        },
        
        // DEFIBRILLATION section (2nd Rescuer)
        {
          checklist_type: 'two man cpr',
          section: 'defribillation',
          item: '2nd Rescuer arrives and turn on AED',
          is_compulsory: false,
          order_index: 16
        },
        {
          checklist_type: 'two man cpr',
          section: 'defribillation',
          item: '2nd Rescuer attach pads while the 1st rescuer continue chest compression',
          is_compulsory: false,
          order_index: 17
        },
        {
          checklist_type: 'two man cpr',
          section: 'defribillation',
          item: '2nd Rescuer clear the victim allowing AED rhythm analysis, RESCUERS SWITCH ROLES',
          is_compulsory: false,
          order_index: 18
        },
        {
          checklist_type: 'two man cpr',
          section: 'defribillation',
          item: 'If shock is advised 2nd rescuer clears the victim and loudly state "Stand Clear" then press the shock button',
          is_compulsory: false,
          order_index: 19
        },
        {
          checklist_type: 'two man cpr',
          section: 'defribillation',
          item: 'After shock, BOTH rescuers immediately resume CPR for 5 cycles or about 2 minutes; 1st rescuer provide ventilation, 2nd rescuer provide chest compression',
          is_compulsory: false,
          order_index: 20
        },
        {
          checklist_type: 'two man cpr',
          section: 'defribillation',
          item: 'If no shock is indicated, BOTH rescuers provide CPR as above',
          is_compulsory: false,
          order_index: 21
        },
        {
          checklist_type: 'two man cpr',
          section: 'defribillation',
          item: 'After 5 cycles or about 2 minutes of CPR, the AED will prompt rescuer to repeat steps (c to e)',
          is_compulsory: false,
          order_index: 22
        },
        {
          checklist_type: 'two man cpr',
          section: 'defribillation',
          item: 'Reassess and RESCUERS SWITCH during AED analysis. If AED not available, rescuers switch role after CPR for 5 cycles or 2 minutes',
          is_compulsory: false,
          order_index: 23
        }
      ];

      const { error } = await supabase
        .from('checklist_item')
        .insert(twoManCPRItems);

      if (error) {
        console.error('Error creating Two Man CPR checklist:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating Two Man CPR checklist:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Create Adult Choking checklist
  static async createAdultChokingChecklist(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initializeTable();
      
      const adultChokingItems: Omit<ChecklistItemData, 'id' | 'created_at' | 'updated_at'>[] = [
        // 1. Assess the severity
        {
          checklist_type: 'adult choking',
          section: 'assess severity',
          item: 'Ask: Are you choking? Are you ok?',
          is_compulsory: false,
          order_index: 1
        },
        {
          checklist_type: 'adult choking',
          section: 'assess severity',
          item: 'Mild - effective cough',
          is_compulsory: false,
          order_index: 2
        },
        {
          checklist_type: 'adult choking',
          section: 'assess severity',
          item: 'Severe - the cough becomes ineffective',
          is_compulsory: false,
          order_index: 3
        },
        // 2. Mild choking
        {
          checklist_type: 'adult choking',
          section: 'mild choking',
          item: 'a. Encourage the victim to cough',
          is_compulsory: false,
          order_index: 4
        },
        // 3. Severe choking
        {
          checklist_type: 'adult choking',
          section: 'severe choking',
          item: 'a. Give 5 back blows:',
          is_compulsory: false,
          order_index: 5
        },
        {
          checklist_type: 'adult choking',
          section: 'severe choking',
          item: 'i. Lean the victim forwards.',
          is_compulsory: false,
          order_index: 6
        },
        {
          checklist_type: 'adult choking',
          section: 'severe choking',
          item: 'ii. Apply blows between the shoulder blades using the heel of one hand',
          is_compulsory: false,
          order_index: 7
        },
        {
          checklist_type: 'adult choking',
          section: 'severe choking',
          item: 'b. If back blows are ineffective, give 5 abdominal thrusts:',
          is_compulsory: false,
          order_index: 8
        },
        {
          checklist_type: 'adult choking',
          section: 'severe choking',
          item: 'i. Stand behind the victim and put both your arms around the upper part of the victim\'s abdomen.',
          is_compulsory: false,
          order_index: 9
        },
        {
          checklist_type: 'adult choking',
          section: 'severe choking',
          item: 'ii. Lean the victim forwards.',
          is_compulsory: false,
          order_index: 10
        },
        {
          checklist_type: 'adult choking',
          section: 'severe choking',
          item: 'iii. Clench your fist and place it between the umbilicus (navel) and the ribcage.',
          is_compulsory: false,
          order_index: 11
        },
        {
          checklist_type: 'adult choking',
          section: 'severe choking',
          item: 'iv. Grasp your fist with the other hand and pull sharply inwards and upwards.',
          is_compulsory: false,
          order_index: 12
        },
        {
          checklist_type: 'adult choking',
          section: 'severe choking',
          item: 'c. Continue alternating 5 back blows with 5 abdominal thrusts until it is relieved, or the victim becomes unconscious.',
          is_compulsory: false,
          order_index: 13
        },
        {
          checklist_type: 'adult choking',
          section: 'severe choking',
          item: 'd. Perform chest thrust for pregnant and very obese victims',
          is_compulsory: false,
          order_index: 14
        },
        // 4. Victim unconscious
        {
          checklist_type: 'adult choking',
          section: 'victim unconscious',
          item: 'a. Start CPR',
          is_compulsory: false,
          order_index: 15
        },
        {
          checklist_type: 'adult choking',
          section: 'victim unconscious',
          item: '-During airway opening, check for foreign body, do not perform a blind finger sweep.',
          is_compulsory: false,
          order_index: 16
        }
      ];

      const { error } = await supabase.from('checklist_item').insert(adultChokingItems);

      if (error) {
        console.error('Error creating Adult Choking checklist:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating Adult Choking checklist:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Create Infant Choking checklist
  static async createInfantChokingChecklist(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initializeTable();
      
      const infantChokingItems: Omit<ChecklistItemData, 'id' | 'created_at' | 'updated_at'>[] = [
        // 1. Assess the severity
        {
          checklist_type: 'infant choking',
          section: 'assess severity',
          item: 'Mild:',
          is_compulsory: false,
          order_index: 1
        },
        {
          checklist_type: 'infant choking',
          section: 'assess severity',
          item: 'coughing effectively (fully responsive, loud cough, taking a breath before coughing), still crying, or speaking',
          is_compulsory: false,
          order_index: 2
        },
        {
          checklist_type: 'infant choking',
          section: 'assess severity',
          item: 'Severe:',
          is_compulsory: false,
          order_index: 3
        },
        {
          checklist_type: 'infant choking',
          section: 'assess severity',
          item: '- ineffective cough, inability to cough, decreasing consciousness, inability to breathe or vocalise, cyanosis.',
          is_compulsory: false,
          order_index: 4
        },
        // 2. Mild choking
        {
          checklist_type: 'infant choking',
          section: 'mild choking',
          item: 'a Encourage the child to cough and continue monitoring the child\'s condition',
          is_compulsory: false,
          order_index: 5
        },
        // 3. Severe choking
        {
          checklist_type: 'infant choking',
          section: 'severe choking',
          item: 'a Ask for help',
          is_compulsory: false,
          order_index: 6
        },
        {
          checklist_type: 'infant choking',
          section: 'severe choking',
          item: 'i. second rescuer should call MERS 999, preferably by mobile phone (speaker function).',
          is_compulsory: false,
          order_index: 7
        },
        {
          checklist_type: 'infant choking',
          section: 'severe choking',
          item: 'ii. A single trained rescuer should first proceed with rescue manoeuvres (unless able to call simultaneously with the speaker function activated)',
          is_compulsory: false,
          order_index: 8
        },
        {
          checklist_type: 'infant choking',
          section: 'severe choking',
          item: 'b Perform 5 back blows and followed with 5 chest thrusts',
          is_compulsory: false,
          order_index: 9
        },
        {
          checklist_type: 'infant choking',
          section: 'severe choking',
          item: 'Back Blows',
          is_compulsory: false,
          order_index: 10
        },
        {
          checklist_type: 'infant choking',
          section: 'severe choking',
          item: 'i. Support the infant in a head-downwards, prone position by placing the thumb of one hand at the angle of the lower jaw. Deliver up to 5 sharp back blows with the heel of one hand in the middle of the back between the shoulder blades.',
          is_compulsory: false,
          order_index: 11
        },
        {
          checklist_type: 'infant choking',
          section: 'severe choking',
          item: 'Chest Thrust',
          is_compulsory: false,
          order_index: 12
        },
        {
          checklist_type: 'infant choking',
          section: 'severe choking',
          item: 'i. Turn the infant into a head-downwards supine position and place free arm along the infant\'s back and encircling the occiput with your hand.',
          is_compulsory: false,
          order_index: 13
        },
        {
          checklist_type: 'infant choking',
          section: 'severe choking',
          item: 'ii. Identify the landmark - lower sternum approximately a finger\'s breadth above the xiphisternum to deliver up to 5 chest thrusts.',
          is_compulsory: false,
          order_index: 14
        },
        {
          checklist_type: 'infant choking',
          section: 'severe choking',
          item: 'c Continue the sequence of back blows and chest trust ff the foreign body has not been expelled and the victim is still conscious.',
          is_compulsory: false,
          order_index: 15
        },
        // 4. Victim unconscious
        {
          checklist_type: 'infant choking',
          section: 'victim unconscious',
          item: 'Start CPR and emphasize on',
          is_compulsory: false,
          order_index: 16
        },
        {
          checklist_type: 'infant choking',
          section: 'victim unconscious',
          item: '-During airway opening, check for foreign body, do not perform a blind finger sweep.',
          is_compulsory: false,
          order_index: 17
        },
        {
          checklist_type: 'infant choking',
          section: 'victim unconscious',
          item: '-Repositioning the head if no chest rises after each breath.',
          is_compulsory: false,
          order_index: 18
        }
      ];

      const { error } = await supabase.from('checklist_item').insert(infantChokingItems);

      if (error) {
        console.error('Error creating Infant Choking checklist:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating Infant Choking checklist:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Create Infant CPR checklist
  static async createInfantCPRChecklist(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initializeTable();
      
      const infantCPRItems: Omit<ChecklistItemData, 'id' | 'created_at' | 'updated_at'>[] = [
        // DANGER section
        {
          checklist_type: 'infant cpr',
          section: 'danger',
          item: 'Wear PPE (gloves, apron, mask), look out for blood spills, sharps, electric wires. Unsteady beds, trolley',
          is_compulsory: false,
          order_index: 1
        },
        // RESPONSE section
        {
          checklist_type: 'infant cpr',
          section: 'respons',
          item: 'Tap baby soles',
          is_compulsory: false,
          order_index: 2
        },
        {
          checklist_type: 'infant cpr',
          section: 'respons',
          item: 'Shout & speak CALL THE INFANT',
          is_compulsory: false,
          order_index: 3
        },
        // SHOUT FOR HELP section
        {
          checklist_type: 'infant cpr',
          section: 'shout for help',
          item: 'For IHCA - Shout "Emergency! Emergency! Bring the resuscitation trolley and defibrillator/AED!"',
          is_compulsory: false,
          order_index: 4
        },
        // AIRWAY section
        {
          checklist_type: 'infant cpr',
          section: 'airway',
          item: 'Head Tilt Chin Lift',
          is_compulsory: true,
          order_index: 5
        },
        {
          checklist_type: 'infant cpr',
          section: 'airway',
          item: 'Jaw Thrust (Trauma)',
          is_compulsory: true,
          order_index: 6
        },
        // BREATHING section
        {
          checklist_type: 'infant cpr',
          section: 'breathing',
          item: 'Look for normal breathing, should not take more than 10 seconds.',
          is_compulsory: true,
          order_index: 7
        },
        {
          checklist_type: 'infant cpr',
          section: 'breathing',
          item: 'Absent/ abnormal breathing - Give 5 initial rescue breaths',
          is_compulsory: true,
          order_index: 8
        },
        {
          checklist_type: 'infant cpr',
          section: 'breathing',
          item: 'Duration of delivering a breath is about 1 second sufficient to produce a visible chest rise',
          is_compulsory: true,
          order_index: 9
        },
        // CIRCULATION section
        {
          checklist_type: 'infant cpr',
          section: 'circulation',
          item: 'Assess the circulation - Look for signs of life or if you are trained feel for brachial pulse for not more than 10 seconds.',
          is_compulsory: true,
          order_index: 10
        },
        {
          checklist_type: 'infant cpr',
          section: 'circulation',
          item: 'Start chest compression if there are no signs of life or the pulse rate is less than 60 beats/min.',
          is_compulsory: true,
          order_index: 11
        },
        {
          checklist_type: 'infant cpr',
          section: 'circulation',
          item: 'Compression technique: For one rescuer CPR - the rescuer compresses with the tips of 2 fingers.',
          is_compulsory: true,
          order_index: 12
        },
        {
          checklist_type: 'infant cpr',
          section: 'circulation',
          item: 'Compression technique: For two rescuers CPR - two thumb chest compression technique',
          is_compulsory: true,
          order_index: 13
        },
        {
          checklist_type: 'infant cpr',
          section: 'circulation',
          item: 'Site of Compression - Lower half of the sternum.',
          is_compulsory: true,
          order_index: 14
        },
        {
          checklist_type: 'infant cpr',
          section: 'circulation',
          item: 'Depth of Compression: At least 1/3 the depth of the chest at least 4cm.',
          is_compulsory: true,
          order_index: 15
        },
        {
          checklist_type: 'infant cpr',
          section: 'circulation',
          item: 'Rate of Compression: At least 100-120/min',
          is_compulsory: true,
          order_index: 16
        },
        {
          checklist_type: 'infant cpr',
          section: 'circulation',
          item: 'Ratio of Compressions to Breaths: One or two Rescuer CPR - 15:2',
          is_compulsory: true,
          order_index: 17
        },
        {
          checklist_type: 'infant cpr',
          section: 'circulation',
          item: 'Unconscious infant whose airway is clear and breathing normally should be put on recovery position (lateral)',
          is_compulsory: true,
          order_index: 18
        }
      ];

      const { error } = await supabase.from('checklist_item').insert(infantCPRItems);

      if (error) {
        console.error('Error creating Infant CPR checklist:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating Infant CPR checklist:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Create One Man CPR checklist
  static async createOneManCPRChecklist(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initializeTable();

      const oneManCPRItems: Omit<ChecklistItemData, 'id' | 'created_at' | 'updated_at'>[] = [
        // DANGER section
        {
          checklist_type: 'one man cpr',
          section: 'danger',
          item: 'Wear PPE (gloves, apron, mask)',
          is_compulsory: false,
          order_index: 1
        },
        {
          checklist_type: 'one man cpr',
          section: 'danger',
          item: 'Look out for hazard',
          is_compulsory: false,
          order_index: 2
        },
        
        // RESPONSE section
        {
          checklist_type: 'one man cpr',
          section: 'respons',
          item: 'Shoulder tap',
          is_compulsory: false,
          order_index: 3
        },
        {
          checklist_type: 'one man cpr',
          section: 'respons',
          item: 'Shout & speak "are you okay?"',
          is_compulsory: false,
          order_index: 4
        },
        
        // SHOUT FOR HELP section
        {
          checklist_type: 'one man cpr',
          section: 'shout for help',
          item: 'For IHCA - Shout "Emergency! Emergency! Bring the resuscitation trolley and defibrillator/AED!"',
          is_compulsory: false,
          order_index: 5
        },
        
        // AIRWAY section
        {
          checklist_type: 'one man cpr',
          section: 'airway',
          item: 'Head Tilt Chin Lift',
          is_compulsory: true,
          order_index: 5
        },
        {
          checklist_type: 'one man cpr',
          section: 'airway',
          item: 'Jaw Thrust',
          is_compulsory: true,
          order_index: 6
        },
        
        // BREATHING section
        {
          checklist_type: 'one man cpr',
          section: 'breathing',
          item: 'Determine while opening the airway by looking at the chest, in not more than 10 seconds (and if you are trained, simultaneously feel for the presence of pulse)',
          is_compulsory: true,
          order_index: 7
        },
        {
          checklist_type: 'one man cpr',
          section: 'breathing',
          item: 'Chest compression shall begin with absence of normal breathing or no pulse',
          is_compulsory: true,
          order_index: 8
        },
        
        // CIRCULATION section
        {
          checklist_type: 'one man cpr',
          section: 'circulation',
          item: 'Performed high quality of CPR',
          is_compulsory: true,
          order_index: 9
        },
        {
          checklist_type: 'one man cpr',
          section: 'circulation',
          item: 'Location -middle of chest, lower half of sternum',
          is_compulsory: true,
          order_index: 10
        },
        {
          checklist_type: 'one man cpr',
          section: 'circulation',
          item: 'Rate of compression: 100-120/min',
          is_compulsory: true,
          order_index: 11
        },
        {
          checklist_type: 'one man cpr',
          section: 'circulation',
          item: 'Depth of compression: 5-6 cm',
          is_compulsory: true,
          order_index: 12
        },
        {
          checklist_type: 'one man cpr',
          section: 'circulation',
          item: 'Full recoil after each compression',
          is_compulsory: true,
          order_index: 13
        },
        {
          checklist_type: 'one man cpr',
          section: 'circulation',
          item: 'Minimize Interruption',
          is_compulsory: true,
          order_index: 14
        },
        {
          checklist_type: 'one man cpr',
          section: 'circulation',
          item: 'Compressions to ventilations ratio, 30:2',
          is_compulsory: true,
          order_index: 15
        },
        {
          checklist_type: 'one man cpr',
          section: 'circulation',
          item: 'Each ventilation in 1 second',
          is_compulsory: true,
          order_index: 16
        },
        
        // DEFIBRILLATION section
        {
          checklist_type: 'one man cpr',
          section: 'defribillation',
          item: 'As soon as the AED arrives, or if one is already available at the site of the cardiac arrest',
          is_compulsory: false,
          order_index: 17
        },
        {
          checklist_type: 'one man cpr',
          section: 'defribillation',
          item: 'Switch on the AED and follow voice prompt',
          is_compulsory: false,
          order_index: 18
        },
        {
          checklist_type: 'one man cpr',
          section: 'defribillation',
          item: 'Attach the electrode pads',
          is_compulsory: false,
          order_index: 19
        },
        {
          checklist_type: 'one man cpr',
          section: 'defribillation',
          item: 'Clear the victim during rhythm analysis',
          is_compulsory: false,
          order_index: 20
        },
        {
          checklist_type: 'one man cpr',
          section: 'defribillation',
          item: 'If shock is advised: i. Clears the victim and loudly state "Stand Clear" ii. Push shock button as directed iii. Immediately resume CPR',
          is_compulsory: false,
          order_index: 21
        },
        {
          checklist_type: 'one man cpr',
          section: 'defribillation',
          item: 'If no shock is indicated, continue CPR',
          is_compulsory: false,
          order_index: 22
        }
      ];

      const { error } = await supabase
        .from('checklist_item')
        .insert(oneManCPRItems);

      if (error) {
        console.error('Error creating One Man CPR checklist:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating One Man CPR checklist:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get checklist items by type
  static async getChecklistItemsByType(checklistType: string): Promise<{ success: boolean; items?: ChecklistItemData[]; error?: string }> {
    try {

      const { data, error } = await supabase
        .from('checklist_item')
        .select('*')
        .eq('checklist_type', checklistType)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('❌ ChecklistItemService: Error fetching checklist items:', error);
        return { success: false, error: error.message };
      }

      const items = data || [];

      if (items.length > 0) {

      }
      
      // If no items found and it's a known checklist type, create it
      if (items.length === 0) {
        if (checklistType === 'one man cpr') {

          const createResult = await this.createOneManCPRChecklist();
          if (createResult.success) {
            // Retry fetching after creation
            const retryResult = await supabase
              .from('checklist_item')
              .select('*')
              .eq('checklist_type', checklistType)
              .order('order_index', { ascending: true });
            
            if (retryResult.data && retryResult.data.length > 0) {
              const newItems = retryResult.data;
              checklistStateManager.updateChecklistData(checklistType, newItems);
              return { success: true, items: newItems };
            }
          }
        } else if (checklistType === 'two man cpr') {

          const createResult = await this.createTwoManCPRChecklist();
          if (createResult.success) {
            // Retry fetching after creation
            const retryResult = await supabase
              .from('checklist_item')
              .select('*')
              .eq('checklist_type', checklistType)
              .order('order_index', { ascending: true });
            
            if (retryResult.data && retryResult.data.length > 0) {
              const newItems = retryResult.data;
              checklistStateManager.updateChecklistData(checklistType, newItems);
              return { success: true, items: newItems };
            }
          }
        } else if (checklistType === 'infant cpr') {

          const createResult = await this.createInfantCPRChecklist();
          if (createResult.success) {
            // Retry fetching after creation
            const retryResult = await supabase
              .from('checklist_item')
              .select('*')
              .eq('checklist_type', checklistType)
              .order('order_index', { ascending: true });
            
            if (retryResult.data && retryResult.data.length > 0) {
              const newItems = retryResult.data;
              checklistStateManager.updateChecklistData(checklistType, newItems);
              return { success: true, items: newItems };
            }
          }
        } else if (checklistType === 'adult choking') {

          const createResult = await this.createAdultChokingChecklist();
          if (createResult.success) {
            // Retry fetching after creation
            const retryResult = await supabase
              .from('checklist_item')
              .select('*')
              .eq('checklist_type', checklistType)
              .order('order_index', { ascending: true });
            
            if (retryResult.data && retryResult.data.length > 0) {
              const newItems = retryResult.data;
              checklistStateManager.updateChecklistData(checklistType, newItems);
              return { success: true, items: newItems };
            }
          }
        } else if (checklistType === 'infant choking') {

          const createResult = await this.createInfantChokingChecklist();
          if (createResult.success) {
            // Retry fetching after creation
            const retryResult = await supabase
              .from('checklist_item')
              .select('*')
              .eq('checklist_type', checklistType)
              .order('order_index', { ascending: true });
            
            if (retryResult.data && retryResult.data.length > 0) {
              const newItems = retryResult.data;
              checklistStateManager.updateChecklistData(checklistType, newItems);
              return { success: true, items: newItems };
            }
          }
        }
      }
      
      // Update global state
      checklistStateManager.updateChecklistData(checklistType, items);
      
      return { success: true, items };
    } catch (error) {
      console.error('Error fetching checklist items:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get all checklist items grouped by type
  static async getAllChecklistItems(): Promise<{ success: boolean; items?: ChecklistItemData[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('checklist_item')
        .select('*')
        .order('checklist_type', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching all checklist items:', error);
        return { success: false, error: error.message };
      }

      return { success: true, items: data || [] };
    } catch (error) {
      console.error('Error fetching all checklist items:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Delete checklist items by type
  static async deleteChecklistItemsByType(checklistType: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('checklist_item')
        .delete()
        .eq('checklist_type', checklistType);

      if (error) {
        console.error('Error deleting checklist items:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting checklist items:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update a single checklist item
  static async updateChecklistItem(itemId: string, updates: Partial<Omit<ChecklistItemData, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; data?: ChecklistItemData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('checklist_item')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating checklist item:', error);
        return { success: false, error: error.message };
      }

      // Update global state
      const currentItems = checklistStateManager.getChecklistData(data.checklist_type);
      const updatedItems = currentItems.map(item => item.id === data.id ? data : item);
      checklistStateManager.updateChecklistData(data.checklist_type, updatedItems);

      return { success: true, data };
    } catch (error) {
      console.error('Error updating checklist item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Delete a single checklist item
  static async deleteChecklistItem(itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('checklist_item')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting checklist item:', error);
        return { success: false, error: error.message };
      }

      // Update global state - remove the deleted item
      const currentItems = checklistStateManager.getChecklistData('one man cpr'); // We need to know the type
      const updatedItems = currentItems.filter(item => item.id !== itemId);
      checklistStateManager.updateChecklistData('one man cpr', updatedItems);

      return { success: true };
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Create a new checklist item
  static async createChecklistItem(item: Omit<ChecklistItemData, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: ChecklistItemData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('checklist_item')
        .insert([item])
        .select()
        .single();

      if (error) {
        console.error('Error creating checklist item:', error);
        return { success: false, error: error.message };
      }

      // Update global state - add the new item
      const currentItems = checklistStateManager.getChecklistData(data.checklist_type);
      const updatedItems = [...currentItems, data];
      checklistStateManager.updateChecklistData(data.checklist_type, updatedItems);

      return { success: true, data };
    } catch (error) {
      console.error('Error creating checklist item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Bulk update checklist items
  static async bulkUpdateChecklistItems(updates: { id: string; updates: Partial<Omit<ChecklistItemData, 'id' | 'created_at' | 'updated_at'>> }[]): Promise<{ success: boolean; error?: string }> {
    try {
      const promises = updates.map(({ id, updates: itemUpdates }) =>
        this.updateChecklistItem(id, itemUpdates)
      );

      const results = await Promise.all(promises);
      const failed = results.filter(result => !result.success);

      if (failed.length > 0) {
        return { success: false, error: `Failed to update ${failed.length} items` };
      }

      return { success: true };
    } catch (error) {
      console.error('Error bulk updating checklist items:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Bulk delete checklist items
  static async bulkDeleteChecklistItems(itemIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('checklist_item')
        .delete()
        .in('id', itemIds);

      if (error) {
        console.error('Error bulk deleting checklist items:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting checklist items:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Fix compulsory status for existing CPR checklists
  static async fixCompulsoryStatusForCPRChecklists(): Promise<{ success: boolean; error?: string }> {
    try {

      // Define which sections should be compulsory for CPR checklists
      const compulsorySections = ['airway', 'breathing', 'circulation'];
      const cprTypes = ['one man cpr', 'two man cpr', 'infant cpr'];
      
      // Get all CPR checklist items
      const { data: cprItems, error: fetchError } = await supabase
        .from('checklist_item')
        .select('*')
        .in('checklist_type', cprTypes);

      if (fetchError) {
        console.error('Error fetching CPR items:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (!cprItems || cprItems.length === 0) {

        return { success: true };
      }

      // Prepare updates
      const updates = cprItems.map(item => {
        const shouldBeCompulsory = compulsorySections.includes(item.section);
        return {
          id: item.id,
          is_compulsory: shouldBeCompulsory
        };
      });

      // Update items in batches
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < updates.length; i += batchSize) {
        batches.push(updates.slice(i, i + batchSize));
      }

      let totalUpdated = 0;
      for (const batch of batches) {
        const promises = batch.map(update => 
          supabase
            .from('checklist_item')
            .update({ is_compulsory: update.is_compulsory })
            .eq('id', update.id)
        );

        const results = await Promise.all(promises);
        const failed = results.filter(result => result.error);
        
        if (failed.length > 0) {
          console.error('Some updates failed:', failed);
          return { success: false, error: `Failed to update ${failed.length} items` };
        }
        
        totalUpdated += batch.length;

      }

      // Clear the cache to force refresh
      checklistStateManager.clear();
      
      return { success: true };
    } catch (error) {
      console.error('Error fixing compulsory status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
