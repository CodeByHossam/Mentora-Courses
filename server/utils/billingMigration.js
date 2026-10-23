const BillingAccount = require('../models/BillingAccount');
const AdminBillingAccount = require('../models/AdminBillingAccount');
const InstructorBillingAccount = require('../models/InstructorBillingAccount');
const StudentBillingAccount = require('../models/StudentBillingAccount');
const User = require('../models/User');

/**
 * Billing System Migration Utilities
 * 
 * Helps migrate from legacy BillingAccount to specialized billing accounts
 */

/**
 * Migrate all legacy billing accounts to specialized accounts
 */
async function migrateLegacyAccounts() {
  try {
    console.log('🔄 Starting billing account migration...');
    
    // Get all legacy billing accounts
    const legacyAccounts = await BillingAccount.find({}).populate('userId');
    console.log(`📊 Found ${legacyAccounts.length} legacy billing accounts`);
    
    let migrated = {
      admin: 0,
      instructor: 0,
      student: 0,
      errors: []
    };
    
    for (const legacyAccount of legacyAccounts) {
      try {
        if (!legacyAccount.userId) {
          console.log('⚠️ Skipping account with no userId:', legacyAccount._id);
          continue;
        }
        
        const user = legacyAccount.userId;
        const userRole = user.role;
        
        console.log(`🔄 Migrating ${userRole} account for user: ${user.name} (${user._id})`);
        
        switch (userRole) {
          case 'admin':
            await migrateAdminAccount(legacyAccount, user);
            migrated.admin++;
            break;
            
          case 'instructor':
            await migrateInstructorAccount(legacyAccount, user);
            migrated.instructor++;
            break;
            
          case 'student':
            await migrateStudentAccount(legacyAccount, user);
            migrated.student++;
            break;
            
          default:
            console.log(`⚠️ Unknown user role: ${userRole}, treating as student`);
            await migrateStudentAccount(legacyAccount, user);
            migrated.student++;
        }
        
      } catch (error) {
        console.error(`❌ Error migrating account ${legacyAccount._id}:`, error);
        migrated.errors.push({
          accountId: legacyAccount._id,
          userId: legacyAccount.userId?._id,
          error: error.message
        });
      }
    }
    
    console.log('✅ Migration completed:', migrated);
    return migrated;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Migrate admin billing account
 */
async function migrateAdminAccount(legacyAccount, user) {
  try {
    // Check if admin account already exists
    const existingAdmin = await AdminBillingAccount.findOne({ adminId: user._id });
    if (existingAdmin) {
      console.log('⚠️ Admin account already exists, skipping');
      return existingAdmin;
    }
    
    // Create new admin billing account
    const adminAccount = await AdminBillingAccount.create({
      adminId: user._id,
      totalRevenue: legacyAccount.totalAdminFeesHistory || 0,
      platformBalance: legacyAccount.CreditAvailableBalance || 0,
      totalInstructorPayouts: legacyAccount.AdminToInstructorPaymentsHistory || 0,
      statistics: {
        totalTransactions: legacyAccount.statistics?.paymentCount || 0,
        lastRevenueUpdate: legacyAccount.updatedAt
      },
      status: legacyAccount.status || 'active'
    });
    
    console.log('✅ Created admin billing account:', adminAccount._id);
    return adminAccount;
    
  } catch (error) {
    console.error('❌ Error migrating admin account:', error);
    throw error;
  }
}

/**
 * Migrate instructor billing account
 */
async function migrateInstructorAccount(legacyAccount, user) {
  try {
    // Check if instructor account already exists
    const existingInstructor = await InstructorBillingAccount.findOne({ instructorId: user._id });
    if (existingInstructor) {
      console.log('⚠️ Instructor account already exists, skipping');
      return existingInstructor;
    }
    
    // Create new instructor billing account
    const instructorAccount = await InstructorBillingAccount.create({
      instructorId: user._id,
      welcomeCredits: legacyAccount.welcomeCredits || 100,
      availableBalance: legacyAccount.CreditAvailableBalance || 0,
      totalCommissionEarned: legacyAccount.totalInstructorProfitsHistory || 0,
      totalPayoutsReceived: legacyAccount.AdminToInstructorPaymentsHistory || 0,
      statistics: {
        totalCoursesSold: legacyAccount.CorsesPurchaseBills?.length || 0,
        lastSaleDate: legacyAccount.statistics?.lastInstructorPaymentAmount ? legacyAccount.updatedAt : null,
        monthlyEarnings: legacyAccount.statistics?.lastInstructorPaymentAmount || 0,
        yearlyEarnings: legacyAccount.totalInstructorProfitsHistory || 0
      },
      status: legacyAccount.status || 'active'
    });
    
    // Migrate course sales from CorsesPurchaseBills
    if (legacyAccount.CorsesPurchaseBills && legacyAccount.CorsesPurchaseBills.length > 0) {
      for (const bill of legacyAccount.CorsesPurchaseBills) {
        instructorAccount.courseSales.push({
          courseId: null, // Would need to be populated from payment data
          studentId: null, // Would need to be populated from payment data
          saleAmount: bill.totalAmount,
          commissionAmount: bill.InstructorPayable,
          adminFeeAmount: bill.AdminFees,
          paymentMethod: 'unknown',
          saleDate: bill.createdAt,
          paymentId: bill.relatedPayment
        });
      }
    }
    
    await instructorAccount.save();
    
    console.log('✅ Created instructor billing account:', instructorAccount._id);
    return instructorAccount;
    
  } catch (error) {
    console.error('❌ Error migrating instructor account:', error);
    throw error;
  }
}

/**
 * Migrate student billing account
 */
async function migrateStudentAccount(legacyAccount, user) {
  try {
    // Check if student account already exists
    const existingStudent = await StudentBillingAccount.findOne({ studentId: user._id });
    if (existingStudent) {
      console.log('⚠️ Student account already exists, skipping');
      return existingStudent;
    }
    
    // Create new student billing account
    const studentAccount = await StudentBillingAccount.create({
      studentId: user._id,
      availableCredits: Math.max(0, legacyAccount.CreditAvailableBalance || 0),
      totalCoursePurchases: legacyAccount.totalCoursesPurchase || 0,
      outstandingAdminFees: legacyAccount.totalAdminFees || 0,
      totalAdminFeesPaid: legacyAccount.InstructorToAdminPaymentsHistory || 0,
      currentBalance: legacyAccount.CreditAvailableBalance || 0,
      creditLimit: legacyAccount.creditLimit || 100,
      statistics: {
        totalCoursesEnrolled: legacyAccount.CorsesPurchaseBills?.length || 0,
        lastPurchaseDate: legacyAccount.statistics?.lastStudentPaymentAmount ? legacyAccount.updatedAt : null,
        monthlySpending: legacyAccount.statistics?.lastStudentPaymentAmount || 0,
        yearlySpending: legacyAccount.totalCoursesPurchase || 0
      },
      status: legacyAccount.status || 'active'
    });
    
    // Migrate course purchases from CorsesPurchaseBills
    if (legacyAccount.CorsesPurchaseBills && legacyAccount.CorsesPurchaseBills.length > 0) {
      for (const bill of legacyAccount.CorsesPurchaseBills) {
        studentAccount.coursePurchases.push({
          courseId: null, // Would need to be populated from payment data
          instructorId: null, // Would need to be populated from payment data
          purchaseAmount: bill.totalAmount,
          adminFeeAmount: bill.AdminFees,
          instructorAmount: bill.InstructorPayable,
          paymentMethod: 'unknown',
          purchaseDate: bill.createdAt,
          paymentId: bill.relatedPayment,
          status: 'completed'
        });
      }
    }
    
    await studentAccount.save();
    
    console.log('✅ Created student billing account:', studentAccount._id);
    return studentAccount;
    
  } catch (error) {
    console.error('❌ Error migrating student account:', error);
    throw error;
  }
}

/**
 * Rollback migration (delete all specialized accounts)
 */
async function rollbackMigration() {
  try {
    console.log('🔄 Rolling back migration...');
    
    const results = await Promise.all([
      AdminBillingAccount.deleteMany({}),
      InstructorBillingAccount.deleteMany({}),
      StudentBillingAccount.deleteMany({})
    ]);
    
    console.log('✅ Rollback completed:', {
      adminDeleted: results[0].deletedCount,
      instructorDeleted: results[1].deletedCount,
      studentDeleted: results[2].deletedCount
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

/**
 * Validate migration (compare counts)
 */
async function validateMigration() {
  try {
    console.log('🔍 Validating migration...');
    
    const [
      legacyCount,
      adminCount,
      instructorCount,
      studentCount
    ] = await Promise.all([
      BillingAccount.countDocuments({}),
      AdminBillingAccount.countDocuments({}),
      InstructorBillingAccount.countDocuments({}),
      StudentBillingAccount.countDocuments({})
    ]);
    
    const specializedTotal = adminCount + instructorCount + studentCount;
    
    const validation = {
      legacyAccounts: legacyCount,
      specializedAccounts: {
        admin: adminCount,
        instructor: instructorCount,
        student: studentCount,
        total: specializedTotal
      },
      migrationComplete: legacyCount === specializedTotal,
      difference: legacyCount - specializedTotal
    };
    
    console.log('📊 Migration validation:', validation);
    return validation;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

module.exports = {
  migrateLegacyAccounts,
  rollbackMigration,
  validateMigration,
  migrateAdminAccount,
  migrateInstructorAccount,
  migrateStudentAccount
};
