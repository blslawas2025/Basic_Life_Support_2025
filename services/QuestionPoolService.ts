import { Question } from '../types/Question';

export interface QuestionPool {
  id: string;
  name: string;
  description: string;
  testType: 'pre_test' | 'post_test' | 'both';
  questionIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  categoryDistribution: {
    [key: string]: number;
  };
}

export interface QuestionPoolSettings {
  enableQuestionPools: boolean;
  defaultPoolId: string | null;
  allowPoolSelection: boolean;
  requirePoolSelection: boolean;
  showPoolInfo: boolean;
  randomizeWithinPool: boolean;
  poolSelectionMode: 'admin' | 'user' | 'both';
}

export class QuestionPoolService {
  private static readonly POOL_PREFIX = 'pool_';
  
  // Create a new question pool
  static async createQuestionPool(
    name: string,
    description: string,
    testType: 'pre_test' | 'post_test' | 'both',
    questionIds: string[],
    createdBy: string,
    tags: string[] = []
  ): Promise<QuestionPool> {
    const poolId = this.generatePoolId();
    const now = new Date().toISOString();
    
    const pool: QuestionPool = {
      id: poolId,
      name,
      description,
      testType,
      questionIds,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy,
      tags,
      difficultyDistribution: {
        easy: 0,
        medium: 0,
        hard: 0,
      },
      categoryDistribution: {},
    };
    
    // Calculate distributions (this would be done with actual question data)
    // For now, we'll set default values
    pool.difficultyDistribution = {
      easy: Math.floor(questionIds.length * 0.3),
      medium: Math.floor(questionIds.length * 0.5),
      hard: Math.floor(questionIds.length * 0.2),
    };
    
    return pool;
  }
  
  // Update question pool
  static async updateQuestionPool(
    poolId: string,
    updates: Partial<Omit<QuestionPool, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<QuestionPool | null> {
    // In a real implementation, this would update the database
    // For now, we'll return a mock updated pool
    const existingPool = await this.getQuestionPool(poolId);
    if (!existingPool) return null;
    
    return {
      ...existingPool,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }
  
  // Get question pool by ID
  static async getQuestionPool(poolId: string): Promise<QuestionPool | null> {
    try {
      const allPools = await this.getAllQuestionPools();
      return allPools.find(pool => pool.id === poolId) || null;
    } catch (error) {
      console.error('Error fetching question pool:', error);
      return null;
    }
  }
  
  // Get all question pools
  static async getAllQuestionPools(): Promise<QuestionPool[]> {
    try {
      // Import QuestionService to fetch real questions
      const { QuestionService } = await import('./QuestionService');
      
      // Get all questions from the database
      const allQuestions = await QuestionService.getAllQuestions();
      
      if (allQuestions.length === 0) {
        // Return empty array if no questions available
        return [];
      }
      
      const pools: QuestionPool[] = [];
      
      // Group questions by question_set for more granular pools
      const preTestQuestions = allQuestions.filter(q => q.test_type === 'pre_test');
      const postTestQuestions = allQuestions.filter(q => q.test_type === 'post_test');
      
      // Create individual Pre Test sets (Set A, Set B, etc.)
      const preTestSets = this.groupQuestionsBySet(preTestQuestions);
      
      // Use the grouped sets (now handles both single sets and multiple sets properly)
      preTestSets.forEach((questions, setName) => {
        pools.push({
          id: `pool_pre_test_${setName.toLowerCase().replace(' ', '_')}`,
          name: `Basic Life Support - Pre Test ${setName}`,
          description: `Questions for BLS pre-test evaluation - ${setName} (${questions.length} questions)`,
          testType: 'pre_test',
          questionIds: questions.map(q => q.id),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
          tags: ['bls', 'pre-test', setName.toLowerCase()],
          difficultyDistribution: {
            easy: Math.floor(questions.length * 0.3),
            medium: Math.floor(questions.length * 0.5),
            hard: Math.floor(questions.length * 0.2),
          },
          categoryDistribution: this.calculateCategoryDistribution(questions),
        });
      });
      
      // Create individual Post Test sets (Set A, Set B, Set C, etc.)
      const postTestSets = this.groupQuestionsBySet(postTestQuestions);
      
      // Use the grouped sets (now handles both single sets and multiple sets properly)
      postTestSets.forEach((questions, setName) => {
        pools.push({
          id: `pool_post_test_${setName.toLowerCase().replace(' ', '_')}`,
          name: `Basic Life Support - Post Test ${setName}`,
          description: `Questions for BLS post-test evaluation - ${setName} (${questions.length} questions)`,
          testType: 'post_test',
          questionIds: questions.map(q => q.id),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
          tags: ['bls', 'post-test', setName.toLowerCase()],
          difficultyDistribution: {
            easy: Math.floor(questions.length * 0.3),
            medium: Math.floor(questions.length * 0.5),
            hard: Math.floor(questions.length * 0.2),
          },
          categoryDistribution: this.calculateCategoryDistribution(questions),
        });
      });
      
      // Comprehensive pool removed - only show specific test sets
      
      return pools;
    } catch (error) {
      console.error('Error fetching question pools:', error);
      return [];
    }
  }
  
  // Helper method to group questions by question_set
  private static groupQuestionsBySet(questions: Question[]): Map<string, Question[]> {
    const sets = new Map<string, Question[]>();
    
    questions.forEach((question, index) => {
      // Check if question_set field exists and is not null/empty
      let setName = 'Set A'; // Default fallback
      
      if (question.question_set && question.question_set.trim() !== '') {
        setName = question.question_set.trim();
        } else {
        // If no question_set field, create a single set for smaller question counts
        // Only split into multiple sets if we have enough questions (90+)
        const totalQuestions = questions.length;
        
        if (totalQuestions >= 90) {
          // For 90+ questions, create 3 sets of 30 each
          const questionsPerSet = Math.ceil(totalQuestions / 3);
          
          if (index < questionsPerSet) {
            setName = 'Set A';
          } else if (index < questionsPerSet * 2) {
            setName = 'Set B';
          } else {
            setName = 'Set C';
          }
          } else {
          // For less than 90 questions, put all in one set
          setName = 'Set A';
          }
      }
      
      if (!sets.has(setName)) {
        sets.set(setName, []);
      }
      sets.get(setName)!.push(question);
    });
    
    return sets;
  }
  
  // Helper method to calculate category distribution
  private static calculateCategoryDistribution(questions: Question[]): {[key: string]: number} {
    const distribution: {[key: string]: number} = {};
    
    questions.forEach(question => {
      const category = question.category || 'uncategorized';
      distribution[category] = (distribution[category] || 0) + 1;
    });
    
    return distribution;
  }
  
  // Get questions for a specific pool
  static async getQuestionsForPool(poolId: string): Promise<Question[]> {
    const pool = await this.getQuestionPool(poolId);
    if (!pool) return [];
    
    // Import QuestionService to fetch real questions
    const { QuestionService } = await import('./QuestionService');
    
    try {
      // Get all questions from the database
      const allQuestions = await QuestionService.getAllQuestions();
      
      // Filter questions that match the pool's question IDs
      const poolQuestions = allQuestions.filter(question => 
        pool.questionIds.includes(question.id)
      );
      
      return poolQuestions;
    } catch (error) {
      console.error('Error fetching questions for pool:', error);
      return [];
    }
  }
  
  // Add questions to pool
  static async addQuestionsToPool(
    poolId: string,
    questionIds: string[]
  ): Promise<boolean> {
    const pool = await this.getQuestionPool(poolId);
    if (!pool) return false;
    
    const updatedQuestionIds = [...pool.questionIds, ...questionIds];
    await this.updateQuestionPool(poolId, {
      questionIds: updatedQuestionIds,
    });
    
    return true;
  }
  
  // Remove questions from pool
  static async removeQuestionsFromPool(
    poolId: string,
    questionIds: string[]
  ): Promise<boolean> {
    const pool = await this.getQuestionPool(poolId);
    if (!pool) return false;
    
    const updatedQuestionIds = pool.questionIds.filter(
      id => !questionIds.includes(id)
    );
    await this.updateQuestionPool(poolId, {
      questionIds: updatedQuestionIds,
    });
    
    return true;
  }
  
  // Delete question pool
  static async deleteQuestionPool(poolId: string): Promise<boolean> {
    try {
      // For now, we'll just return true since these are dynamically generated pools
      // In a real implementation, this would delete from database
      return true;
    } catch (error) {
      console.error('Error deleting question pool:', error);
      return false;
    }
  }
  
  // Get pools by test type
  static async getPoolsByTestType(
    testType: 'pre_test' | 'post_test'
  ): Promise<QuestionPool[]> {
    try {
      const allPools = await this.getAllQuestionPools();
      return allPools.filter(
        pool => pool.testType === testType || pool.testType === 'both'
      );
    } catch (error) {
      console.error('Error fetching pools by test type:', error);
      return [];
    }
  }
  
  // Get active pools
  static async getActivePools(): Promise<QuestionPool[]> {
    try {
      const allPools = await this.getAllQuestionPools();
      return allPools.filter(pool => pool.isActive);
    } catch (error) {
      console.error('Error fetching active pools:', error);
      return [];
    }
  }
  
  // Generate unique pool ID
  private static generatePoolId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.POOL_PREFIX}${timestamp}_${random}`.toUpperCase();
  }
  
  // Validate pool data
  static validatePoolData(data: Partial<QuestionPool>): boolean {
    return !!(
      data.name &&
      data.description &&
      data.testType &&
      data.questionIds &&
      data.questionIds.length > 0
    );
  }
  
  // Get pool statistics
  static async getPoolStatistics(poolId: string): Promise<{
    totalQuestions: number;
    difficultyBreakdown: {[key: string]: number};
    categoryBreakdown: {[key: string]: number};
    averageDifficulty: number;
  } | null> {
    try {
      const pool = await this.getQuestionPool(poolId);
      if (!pool) return null;
      
      // Get actual questions to calculate real statistics
      const questions = await this.getQuestionsForPool(poolId);
      
      return {
        totalQuestions: questions.length,
        difficultyBreakdown: pool.difficultyDistribution,
        categoryBreakdown: pool.categoryDistribution,
        averageDifficulty: questions.length > 0 ? 
          questions.reduce((sum, q) => sum + (q.difficulty_level || 2), 0) / questions.length : 2,
      };
    } catch (error) {
      console.error('Error getting pool statistics:', error);
      return null;
    }
  }
  
  // Search pools
  static async searchPools(
    query: string,
    testType?: 'pre_test' | 'post_test' | 'both'
  ): Promise<QuestionPool[]> {
    try {
      const allPools = await this.getAllQuestionPools();
      
      let filteredPools = allPools.filter(pool =>
        pool.name.toLowerCase().includes(query.toLowerCase()) ||
        pool.description.toLowerCase().includes(query.toLowerCase()) ||
        pool.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      
      if (testType) {
        filteredPools = filteredPools.filter(
          pool => pool.testType === testType || pool.testType === 'both'
        );
      }
      
      return filteredPools;
    } catch (error) {
      console.error('Error searching pools:', error);
      return [];
    }
  }

  // Get assigned pool for a specific test type
  static async getAssignedPool(testType: 'pre_test' | 'post_test'): Promise<QuestionPool | null> {
    try {
      // Check localStorage for assigned pools
      const storedAssignments = localStorage.getItem('questionPoolAssignments');
      let assignments: { preTest: string | null; postTest: string | null } = {
        preTest: null,
        postTest: null,
      };
      
      if (storedAssignments) {
        try {
          assignments = JSON.parse(storedAssignments);
        } catch (e) {
        }
      }
      
      const assignedPoolId = testType === 'pre_test' ? assignments.preTest : assignments.postTest;
      
      if (!assignedPoolId) {
        return null;
      }
      
      const allPools = await this.getAllQuestionPools();
      const assignedPool = allPools.find(pool => pool.id === assignedPoolId);
      
      return assignedPool || null;
    } catch (error) {
      console.error('Error getting assigned pool:', error);
      return null;
    }
  }

  // Assign a pool to a test type
  static async assignPoolToTest(testType: 'pre_test' | 'post_test', poolId: string | null): Promise<boolean> {
    try {
      const storedAssignments = localStorage.getItem('questionPoolAssignments');
      let assignments: { preTest: string | null; postTest: string | null } = {
        preTest: null,
        postTest: null,
      };
      
      if (storedAssignments) {
        try {
          assignments = JSON.parse(storedAssignments);
        } catch (e) {
        }
      }
      
      if (testType === 'pre_test') {
        assignments.preTest = poolId;
      } else {
        assignments.postTest = poolId;
      }
      
      localStorage.setItem('questionPoolAssignments', JSON.stringify(assignments));
      return true;
    } catch (error) {
      console.error('Error assigning pool to test:', error);
      return false;
    }
  }

  // Get questions from assigned pool for a test type
  static async getQuestionsFromAssignedPool(testType: 'pre_test' | 'post_test'): Promise<Question[]> {
    try {
      const assignedPool = await this.getAssignedPool(testType);
      
      if (!assignedPool) {
        return [];
      }
      
      // Import QuestionService to fetch the actual questions
      const { QuestionService } = await import('./QuestionService');
      
      // Get all questions and filter by the pool's question IDs
      const allQuestions = await QuestionService.getAllQuestions();
      const poolQuestions = allQuestions.filter(question => 
        assignedPool.questionIds.includes(question.id)
      );
      
      return poolQuestions;
    } catch (error) {
      console.error('Error getting questions from assigned pool:', error);
      return [];
    }
  }
}
