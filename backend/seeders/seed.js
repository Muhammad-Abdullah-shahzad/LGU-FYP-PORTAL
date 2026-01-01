import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Timeline from '../models/Timeline.js';
import connectDB from '../config/database.js';

// Load env vars
dotenv.config();

// Sample data
const users = [
    // Coordinators
    {
        email: 'coordinator@lgu.edu.pk',
        password: 'password123',
        role: 'coordinator',
        firstName: 'Dr. Ahmed',
        lastName: 'Hassan',
        isActive: true
    },

    // Supervisors
    {
        email: 'supervisor1@lgu.edu.pk',
        password: 'password123',
        role: 'supervisor',
        firstName: 'Dr. Fatima',
        lastName: 'Khan',
        domain: 'Software Engineering',
        designation: 'Associate Professor',
        isActive: true
    },
    {
        email: 'supervisor2@lgu.edu.pk',
        password: 'password123',
        role: 'supervisor',
        firstName: 'Dr. Ali',
        lastName: 'Raza',
        domain: 'Artificial Intelligence',
        designation: 'Assistant Professor',
        isActive: true
    },
    {
        email: 'supervisor3@lgu.edu.pk',
        password: 'password123',
        role: 'supervisor',
        firstName: 'Dr. Sara',
        lastName: 'Ahmed',
        domain: 'Data Science',
        designation: 'Associate Professor',
        isActive: true
    },

    // Panel Members
    {
        email: 'panel1@lgu.edu.pk',
        password: 'password123',
        role: 'panel_member',
        firstName: 'Dr. Muhammad',
        lastName: 'Usman',
        domain: 'Software Engineering',
        designation: 'Assistant Professor',
        isActive: true
    },
    {
        email: 'panel2@lgu.edu.pk',
        password: 'password123',
        role: 'panel_member',
        firstName: 'Dr. Ayesha',
        lastName: 'Malik',
        domain: 'Artificial Intelligence',
        designation: 'Lecturer',
        isActive: true
    },

    // Students
    {
        email: 'student1@lgu.edu.pk',
        password: 'password123',
        role: 'student',
        firstName: 'Hassan',
        lastName: 'Ali',
        registrationNumber: 'L1F21BSCS0001',
        isActive: true
    },
    {
        email: 'student2@lgu.edu.pk',
        password: 'password123',
        role: 'student',
        firstName: 'Zainab',
        lastName: 'Fatima',
        registrationNumber: 'L1F21BSCS0002',
        isActive: true
    },
    {
        email: 'student3@lgu.edu.pk',
        password: 'password123',
        role: 'student',
        firstName: 'Usman',
        lastName: 'Ahmed',
        registrationNumber: 'L1F21BSCS0003',
        isActive: true
    },
    {
        email: 'student4@lgu.edu.pk',
        password: 'password123',
        role: 'student',
        firstName: 'Maryam',
        lastName: 'Khan',
        registrationNumber: 'L1F21BSCS0004',
        isActive: true
    }
];

const timelines = [
    {
        batch: 'Spring',
        year: 2025,
        semester: 7,
        groupRegistrationStart: new Date('2025-01-15'),
        groupRegistrationEnd: new Date('2025-01-31'),
        proposalSubmissionStart: new Date('2025-02-01'),
        proposalSubmissionEnd: new Date('2025-02-21'),
        proposalDefenseStart: new Date('2025-02-22'),
        proposalDefenseEnd: new Date('2025-03-07'),
        internalDefenseStart: new Date('2025-04-01'),
        internalDefenseEnd: new Date('2025-04-14'),
        isActive: true
    },
    {
        batch: 'Spring',
        year: 2025,
        semester: 8,
        groupRegistrationStart: new Date('2025-01-15'),
        groupRegistrationEnd: new Date('2025-01-31'),
        srsDefenseStart: new Date('2025-03-15'),
        srsDefenseEnd: new Date('2025-03-30'),
        externalDefenseStart: new Date('2025-05-15'),
        externalDefenseEnd: new Date('2025-05-31'),
        isActive: true
    }
];

// Seed function
const seedDatabase = async () => {
    try {
        // Connect to DB
        await connectDB();

        console.log('🗑️  Clearing existing data...');

        // Clear existing data
        await User.deleteMany({});
        await Timeline.deleteMany({});

        console.log('👥 Creating users...');

        // Create users
        const createdUsers = await User.create(users);
        console.log(`✅ Created ${createdUsers.length} users`);

        console.log('📅 Creating timelines...');

        // Create timeline and associate with coordinator
        const coordinator = createdUsers.find(u => u.role === 'coordinator');

        const timelineData = timelines.map(t => ({
            ...t,
            createdBy: coordinator._id
        }));

        const createdTimelines = await Timeline.insertMany(timelineData);
        createdTimelines.forEach(t => {
            console.log(`✅ Created timeline for ${t.batch} ${t.year}, Semester ${t.semester}`);
        });

        console.log('\n✨ Database seeded successfully!\n');

        console.log('📋 Sample Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Coordinator:');
        console.log('  Email: coordinator@lgu.edu.pk');
        console.log('  Password: password123\n');

        console.log('Supervisor:');
        console.log('  Email: supervisor1@lgu.edu.pk');
        console.log('  Password: password123\n');

        console.log('Student:');
        console.log('  Email: student1@lgu.edu.pk');
        console.log('  Password: password123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run seeder
seedDatabase();
