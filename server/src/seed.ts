import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { User, UserRole } from './models/User.model';
import { Batch } from './models/Batch.model';
import { Attendance, AttendanceStatus } from './models/Attendance.model';
import { Fee, FeeStatus } from './models/Fee.model';
import { Announcement, AnnouncementPriority } from './models/Announcement.model';
import { env } from './config/env.config';

const seedDatabase = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('🌱 Connected to MongoDB for comprehensive database seeding...');

    // Clear existing data across all collections
    await User.deleteMany({});
    await Batch.deleteMany({});
    await Attendance.deleteMany({});
    await Fee.deleteMany({});
    await Announcement.deleteMany({});

    console.log('🧹 Existing collections cleared.');

    const credentialsList: any = {
      generatedAt: new Date().toISOString(),
      platform: 'Apex Coaching Institute Management System',
      director: [],
      admins: [],
      teachers: [],
      sampleActiveStudents: [],
      sampleParents: [],
      summaryStats: {
        totalDirectors: 1,
        totalAdmins: 2,
        totalTeachers: 10,
        activeStudentsEnrolled: 210,
        graduatedAlumni: 2000,
        totalBatches: 12,
      },
    };

    // 1. CREATE DIRECTOR & ADMINS
    console.log('👤 Creating Director (1) and Admin staff (2)...');
    const director = await User.create({
      name: 'Anand Pandey (Director)',
      email: 'director@apexcoaching.com',
      password: 'Director@2026',
      role: UserRole.DIRECTOR,
      permissions: [
        'MANAGE_PERMISSIONS',
        'MANAGE_USERS',
        'MANAGE_BATCHES',
        'MANAGE_FEES',
        'MARK_ATTENDANCE',
        'BROADCAST_ANNOUNCEMENTS',
      ],
      phone: '+91 87503 09712',
    });

    credentialsList.director.push({
      role: 'DIRECTOR',
      name: director.name,
      email: director.email,
      password: 'Director@2026',
      phone: director.phone,
    });

    const adminMain = await User.create({
      name: 'Academic Admin Manager',
      email: 'admin@apexcoaching.com',
      password: 'Admin@2026',
      role: UserRole.ADMIN,
      permissions: [
        'MANAGE_BATCHES',
        'MANAGE_USERS',
        'MANAGE_FEES',
        'MARK_ATTENDANCE',
        'BROADCAST_ANNOUNCEMENTS',
      ],
      phone: '+91 98765 00001',
    });

    const adminFinance = await User.create({
      name: 'Finance Desk Admin',
      email: 'finance@apexcoaching.com',
      password: 'Finance@2026',
      role: UserRole.ADMIN,
      permissions: ['MANAGE_FEES', 'MANAGE_USERS', 'BROADCAST_ANNOUNCEMENTS'],
      phone: '+91 98765 00004',
    });

    credentialsList.admins.push(
      { role: 'ADMIN', name: adminMain.name, email: adminMain.email, password: 'Admin@2026', phone: adminMain.phone },
      { role: 'ADMIN', name: adminFinance.name, email: adminFinance.email, password: 'Finance@2026', phone: adminFinance.phone }
    );

    // 2. CREATE 10 TEACHERS / FACULTY MEMBERS
    console.log('👩‍🏫 Creating 10 Faculty / Teacher Specialists...');
    const teacherData = [
      { name: 'Dr. Vikramaditya Roy', email: 'vikram.maths@apexcoaching.com', phone: '+91 98765 00011', subject: 'Mathematics' },
      { name: 'Prof. Ananya Verma', email: 'ananya.physics@apexcoaching.com', phone: '+91 98765 00012', subject: 'Physics' },
      { name: 'Dr. Priyanka Sharma', email: 'priyanka.chem@apexcoaching.com', phone: '+91 98765 00013', subject: 'Chemistry' },
      { name: 'Prof. Rajesh Nambiar', email: 'rajesh.bio@apexcoaching.com', phone: '+91 98765 00014', subject: 'Biology' },
      { name: 'Ms. Sunita Rao', email: 'sunita.english@apexcoaching.com', phone: '+91 98765 00015', subject: 'English' },
      { name: 'Mr. Amit Joshi', email: 'amit.social@apexcoaching.com', phone: '+91 98765 00016', subject: 'Social Studies' },
      { name: 'Ms. Kavita Singh', email: 'kavita.hindi@apexcoaching.com', phone: '+91 98765 00017', subject: 'Hindi' },
      { name: 'Dr. Vikram Chawla', email: 'vikram.science@apexcoaching.com', phone: '+91 98765 00018', subject: 'Integrated Science' },
      { name: 'Dr. Priya Malhotra', email: 'priya.foundation@apexcoaching.com', phone: '+91 98765 00019', subject: 'NTSE Foundation' },
      { name: 'Prof. Anjali Verma', email: 'anjali.olympiad@apexcoaching.com', phone: '+91 98765 00020', subject: 'Olympiad Specialist' },
    ];

    const teacherDocs: any[] = [];
    for (const t of teacherData) {
      const doc = await User.create({
        name: t.name,
        email: t.email,
        password: 'Teacher@2026',
        role: UserRole.TEACHER,
        permissions: ['MARK_ATTENDANCE', 'BROADCAST_ANNOUNCEMENTS'],
        phone: t.phone,
      });
      teacherDocs.push(doc);

      credentialsList.teachers.push({
        role: 'TEACHER',
        name: t.name,
        email: t.email,
        password: 'Teacher@2026',
        subject: t.subject,
        phone: t.phone,
      });
    }

    // 3. CREATE BATCHES (12 ACTIVE BATCHES FOR CURRENT SESSION)
    console.log('📚 Creating 12 Active Batches (Classes 01 to 10 + JEE/NEET)...');
    const batchDefs = [
      { name: 'Class 01 Foundation Batch', code: 'CLASS-01-FOUND', subject: 'Maths, English, Hindi', feeAmount: 1500, capacity: 25, teacher: teacherDocs[4] },
      { name: 'Class 02 Junior Achievers', code: 'CLASS-02-ACHIEV', subject: 'Maths, English, EVS', feeAmount: 1600, capacity: 25, teacher: teacherDocs[4] },
      { name: 'Class 03 Elementary Champions', code: 'CLASS-03-CHAMP', subject: 'Maths, Science, English', feeAmount: 1800, capacity: 25, teacher: teacherDocs[0] },
      { name: 'Class 04 Primary Excellence', code: 'CLASS-04-EXCELL', subject: 'Maths, Science, Social Studies', feeAmount: 2000, capacity: 30, teacher: teacherDocs[5] },
      { name: 'Class 05 Middle Preparation', code: 'CLASS-05-PREP', subject: 'Maths, Science, English', feeAmount: 2200, capacity: 30, teacher: teacherDocs[2] },
      { name: 'Class 06 Middle School Foundation', code: 'CLASS-06-FOUND', subject: 'Maths, Physics, Chem, Bio', feeAmount: 2500, capacity: 30, teacher: teacherDocs[1] },
      { name: 'Class 07 Science & Maths Scholars', code: 'CLASS-07-SCHOLAR', subject: 'Maths, Science, SST', feeAmount: 2800, capacity: 30, teacher: teacherDocs[3] },
      { name: 'Class 08 Pre-High School Olympiad', code: 'CLASS-08-OLYMPIAD', subject: 'Physics, Chem, Maths, Bio', feeAmount: 3000, capacity: 35, teacher: teacherDocs[9] },
      { name: 'Class 09 Board Foundation & NTSE', code: 'CLASS-09-BOARD', subject: 'Physics, Chem, Bio, Maths', feeAmount: 3500, capacity: 40, teacher: teacherDocs[8] },
      { name: 'Class 10 Board Excellence & Apex Super 30', code: 'CLASS-10-EXCELL', subject: 'Physics, Chem, Bio, Maths', feeAmount: 4000, capacity: 40, teacher: teacherDocs[7] },
      { name: 'Class 11 JEE/NEET Target Batch', code: 'JEE-NEET-11', subject: 'Physics, Chemistry, Maths, Bio', feeAmount: 4500, capacity: 40, teacher: teacherDocs[1] },
      { name: 'Class 12 Advanced Science (IIT-JEE)', code: 'JEE-SCI-12', subject: 'Physics, Chemistry, Mathematics', feeAmount: 5000, capacity: 40, teacher: teacherDocs[0] },
    ];

    const batchDocs: any[] = [];
    for (const b of batchDefs) {
      const doc = await Batch.create({
        name: b.name,
        code: b.code,
        subject: b.subject,
        teacherId: b.teacher._id,
        subjects: [
          { name: 'Mathematics', teacherId: teacherDocs[0]._id, scheduleType: 'MWF', days: ['Mon', 'Wed', 'Fri'], schedule: 'Mon, Wed, Fri (04:00 PM - 05:30 PM)' },
          { name: 'Science / Physics', teacherId: teacherDocs[1]._id, scheduleType: 'TTS', days: ['Tue', 'Thu', 'Sat'], schedule: 'Tue, Thu, Sat (04:00 PM - 05:30 PM)' },
        ],
        studentIds: [],
        schedule: 'MWF & TTS Schedules',
        startDate: '2026-08-01',
        endDate: '2027-05-31',
        feeAmount: b.feeAmount,
        capacity: b.capacity,
        isActive: true,
      });
      batchDocs.push(doc);
    }

    // 4. CREATE 210 ACTIVE STUDENTS (ENROLLED IN BATCHES)
    console.log('🎓 Creating 210 Active Students enrolled across 12 Batches...');
    const firstNames = ['Aarav', 'Diya', 'Ishan', 'Ananya', 'Vivaan', 'Myra', 'Kabir', 'Sara', 'Reyansh', 'Anika', 'Advait', 'Kiara', 'Krishna', 'Riya', 'Tanmay', 'Sneha', 'Rohan', 'Pooja', 'Siddharth', 'Kavya'];
    const lastNames = ['Kumar', 'Sharma', 'Verma', 'Das', 'Gupta', 'Kapoor', 'Joshi', 'Ali', 'Patel', 'Sen', 'Nair', 'Reddy', 'Yadav', 'Singh', 'Saxena', 'Roy', 'Mehta', 'Hegde', 'Rao', 'Menon'];

    const studentDocs: any[] = [];
    for (let i = 1; i <= 210; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      const batchIdx = (i - 1) % batchDocs.length;
      const targetBatch = batchDocs[batchIdx];

      const student = await User.create({
        name: `${fn} ${ln}`,
        email: `student${i}@apexcoaching.com`,
        password: 'Student@2026',
        role: UserRole.STUDENT,
        phone: `+91 9811${String(i).padStart(6, '0')}`,
        batchIds: [targetBatch._id],
      });

      studentDocs.push(student);
      
      // Update batch studentIds array
      await Batch.findByIdAndUpdate(targetBatch._id, { $push: { studentIds: student._id } });

      // Save sample student credentials for json output
      if (i <= 20) {
        credentialsList.sampleActiveStudents.push({
          rollNumber: `STU-2026-${String(i).padStart(3, '0')}`,
          name: student.name,
          email: student.email,
          password: 'Student@2026',
          assignedBatch: targetBatch.name,
          feeAmount: targetBatch.feeAmount,
          phone: student.phone,
        });
      }
    }

    // 5. CREATE 2,000 GRADUATED ALUMNI RECORDS (INACTIVE / GRADUATED)
    console.log('📜 Creating 2,000 Graduated Alumni Records...');
    const alumniBatchSize = 500;
    for (let batchOffset = 0; batchOffset < 2000; batchOffset += alumniBatchSize) {
      const alumniBatch = [];
      for (let j = 1; j <= alumniBatchSize; j++) {
        const idNum = batchOffset + j;
        const fn = firstNames[idNum % firstNames.length];
        const ln = lastNames[(idNum * 7) % lastNames.length];

        alumniBatch.push({
          name: `Alumni ${fn} ${ln}`,
          email: `alumni${idNum}@apexalumni.org`,
          password: 'Alumni@2026',
          role: UserRole.STUDENT,
          phone: `+91 9899${String(idNum).padStart(6, '0')}`,
          createdAt: new Date('2024-05-15'),
          updatedAt: new Date('2025-05-30'),
        });
      }
      await User.insertMany(alumniBatch);
    }

    // 6. CREATE REAL PAYMENT / FEE RECORDS FOR ACTIVE STUDENTS
    console.log('💳 Generating Fee payment receipts for active students...');
    const feeRecords = [];
    const currentMonth = 'August 2026';

    for (let sIdx = 0; sIdx < studentDocs.length; sIdx++) {
      const student = studentDocs[sIdx];
      const batchId = student.batchIds[0];
      const batchObj = batchDocs.find((b) => b._id.toString() === batchId.toString());
      const feeAmount = batchObj ? batchObj.feeAmount : 2500;

      let status = FeeStatus.PAID;
      let amountPaid = feeAmount;
      let paymentMethod: any = 'UPI';

      if (sIdx % 4 === 1) {
        status = FeeStatus.PARTIAL;
        amountPaid = Math.floor(feeAmount / 2);
      } else if (sIdx % 4 === 2) {
        status = FeeStatus.PENDING;
        amountPaid = 0;
      } else if (sIdx % 4 === 3) {
        status = FeeStatus.OVERDUE;
        amountPaid = 0;
      }

      feeRecords.push({
        studentId: student._id,
        batchId: batchId,
        month: currentMonth,
        amountDue: feeAmount,
        amountPaid: amountPaid,
        dueDate: '2026-08-05',
        paidDate: status === FeeStatus.PAID || status === FeeStatus.PARTIAL ? '2026-08-03' : undefined,
        status: status,
        paymentMethod: status === FeeStatus.PAID || status === FeeStatus.PARTIAL ? paymentMethod : undefined,
        receiptNumber: `RCP-2026-${String(sIdx + 1).padStart(4, '0')}`,
        notes: status === FeeStatus.PAID ? 'Paid in full' : status === FeeStatus.PARTIAL ? 'First installment' : 'Payment pending',
      });
    }

    await Fee.insertMany(feeRecords);

    // 7. SEED ANNOUNCEMENTS
    console.log('📢 Creating Official Announcements...');
    await Announcement.create([
      {
        title: 'Class 10th & 12th Board Mock Examination Schedule Released',
        message: 'The full length CBSE 10th & 12th Mock Series starts on August 24th. All students must bring their admit cards.',
        targetBatchId: batchDocs[9]._id,
        priority: AnnouncementPriority.EXAM,
        authorId: director._id,
      },
      {
        title: 'National Science Olympiad (NSO) 2026 Registrations',
        message: 'Registrations are open for NSO 2026. Interested students submit details to Dr. Priyanka by Aug 25th.',
        targetBatchId: null,
        priority: AnnouncementPriority.GENERAL,
        authorId: director._id,
      },
    ]);

    // 8. EXPORT CREDENTIALS JSON FILE
    console.log('📄 Exporting Credentials JSON file...');
    const jsonPathWorkspace = path.resolve(__dirname, '../../../credentials.json');
    const jsonPathServer = path.resolve(__dirname, '../credentials.json');

    const jsonContent = JSON.stringify(credentialsList, null, 2);
    fs.writeFileSync(jsonPathWorkspace, jsonContent);
    fs.writeFileSync(jsonPathServer, jsonContent);

    console.log(`\n✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!`);
    console.log(`📊 Total Seeded Summary:`);
    console.log(` - 1 Director (director@apexcoaching.com / Director@2026)`);
    console.log(` - 2 Admins (admin@apexcoaching.com / Admin@2026, finance@apexcoaching.com / Finance@2026)`);
    console.log(` - 10 Faculty Specialists (teacher1@... / Teacher@2026)`);
    console.log(` - 210 Enrolled Active Students across 12 Active Batches (student1@... to student210@... / Student@2026)`);
    console.log(` - 2,000 Graduated Alumni Records (alumni1@... / Alumni@2026)`);
    console.log(` - 210 Detailed Fee Receipts & Payment Records`);
    console.log(` 📂 Generated credentials JSON saved at:`);
    console.log(`   - ${jsonPathWorkspace}`);
    console.log(`   - ${jsonPathServer}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
