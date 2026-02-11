import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Timeline from '../models/Timeline.js';
import Group from '../models/Group.js';
import DefensePanel from '../models/DefensePanel.js';
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
        domain: ['Software Engineering', 'Web Development'],
        designation: 'Associate Professor',
        isActive: true
    },
    {
        email: 'supervisor2@lgu.edu.pk',
        password: 'password123',
        role: 'supervisor',
        firstName: 'Dr. Ali',
        lastName: 'Raza',
        domain: ['Artificial Intelligence', 'ML'],
        designation: 'Assistant Professor',
        isActive: true
    },
    {
        email: 'supervisor3@lgu.edu.pk',
        password: 'password123',
        role: 'supervisor',
        firstName: 'Dr. Sara',
        lastName: 'Ahmed',
        domain: ['Data Science'],
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
        domain: ['Software Engineering'],
        designation: 'Assistant Professor',
        isActive: true
    },
    {
        email: 'panel2@lgu.edu.pk',
        password: 'password123',
        role: 'panel_member',
        firstName: 'Dr. Ayesha',
        lastName: 'Malik',
        domain: ['Artificial Intelligence'],
        designation: 'Lecturer',
        isActive: true
    },

    // Students (Batch Fall-2023, Semester 7)
    {
        email: 'student1@lgu.edu.pk',
        password: 'password123',
        role: 'student',
        firstName: 'Hassan',
        lastName: 'Ali',
        registrationNumber: 'LGU-F23-001',
        degree: 'BSSE',
        batch: 'Fall',
        enrolledYear: 2023,
        semester: 7,
        isActive: true
    },
    {
        email: 'student2@lgu.edu.pk',
        password: 'password123',
        role: 'student',
        firstName: 'Zainab',
        lastName: 'Fatima',
        registrationNumber: 'LGU-F23-002',
        degree: 'BSSE',
        batch: 'Fall',
        enrolledYear: 2023,
        semester: 7,
        isActive: true
    },

    // Students (Batch Spring-2024, Semester 7)
    {
        email: 'student3@lgu.edu.pk',
        password: 'password123',
        role: 'student',
        firstName: 'Usman',
        lastName: 'Ahmed',
        registrationNumber: 'LGU-S24-001',
        degree: 'BSCS',
        batch: 'Spring',
        enrolledYear: 2024,
        semester: 7,
        isActive: true
    },
    {
        email: 'student4@lgu.edu.pk',
        password: 'password123',
        role: 'student',
        firstName: 'Maryam',
        lastName: 'Khan',
        registrationNumber: 'LGU-S24-002',
        degree: 'BSCS',
        batch: 'Spring',
        enrolledYear: 2024,
        semester: 7,
        isActive: true
    },
    // Unassigned Student (Fall 2023)
    {
        email: 'student5@lgu.edu.pk',
        password: 'password123',
        role: 'student',
        firstName: 'Bilal',
        lastName: 'Bashir',
        registrationNumber: 'LGU-F23-003',
        degree: 'BSSE',
        batch: 'Fall',
        enrolledYear: 2023,
        semester: 7,
        isActive: true
    }
];

const timelines = [
    {
        batch: 'Fall',
        batchYear: 2023,
        year: 2026,
        semester: 7,
        groupRegistrationStatus: 'Closed',
        groupRegistrationStart: new Date('2026-01-01'),
        groupRegistrationEnd: new Date('2026-01-31'),
        proposalSubmissionStatus: 'Open',
        proposalSubmissionStart: new Date('2026-02-01'),
        proposalSubmissionEnd: new Date('2026-02-28'),
        proposalDefenseStatus: 'Closed',
        proposalDefenseStart: new Date('2026-03-01'),
        proposalDefenseEnd: new Date('2026-03-15'),
        isActive: true
    },
    {
        batch: 'Spring',
        batchYear: 2024,
        year: 2026,
        semester: 7,
        groupRegistrationStatus: 'Open',
        groupRegistrationStart: new Date('2026-02-01'),
        groupRegistrationEnd: new Date('2026-02-28'),
        proposalSubmissionStatus: 'Closed',
        proposalSubmissionStart: new Date('2026-03-01'),
        proposalSubmissionEnd: new Date('2026-03-31'),
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
        await Group.deleteMany({});
        await DefensePanel.deleteMany({});

        console.log('👥 Creating users...');

        // Create users
        const createdUsers = await User.create(users);
        console.log(`✅ Created ${createdUsers.length} users`);

        // Helper to find user by email
        const getUserByEmail = (email) => createdUsers.find(u => u.email === email);

        console.log('📅 Creating timelines...');

        const coordinator = getUserByEmail('coordinator@lgu.edu.pk');

        const timelineData = timelines.map(t => ({
            ...t,
            createdBy: coordinator._id
        }));

        await Timeline.insertMany(timelineData);
        console.log(`✅ Created ${timelineData.length} timelines`);


        console.log('🎓 Creating groups...');

        const student1 = getUserByEmail('student1@lgu.edu.pk');
        const student2 = getUserByEmail('student2@lgu.edu.pk');
        const supervisor1 = getUserByEmail('supervisor1@lgu.edu.pk');

        // Group 1: Fall Batch, Registered, Supervisor Assigned
        const group1 = await Group.create({
            groupName: 'FYP-F2026-001',
            student1: student1._id,
            student2: student2._id,
            student2Status: 'approved',
            leader: student1._id,
            projectTitle: 'Smart Campus Navigation System',
            projectDomain: 'Software Engineering',
            projectSummary: 'An AI-powered navigation system for the university campus assisting new students and visitors.',
            supervisor: supervisor1._id,
            supervisorStatus: 'approved',
            supervisorRequestDate: new Date(),
            batch: 'Fall',
            year: 2026,
            batchYear: 2023,
            semester: 7,
            status: 'proposal_submitted',
            proposalDocument: 'https://example.com/proposal.pdf'
        });

        console.log(`✅ Created Group 1: ${group1.groupName}`);

        // Group 2: Spring Batch, Just Registered
        const student3 = getUserByEmail('student3@lgu.edu.pk');
        const student4 = getUserByEmail('student4@lgu.edu.pk');

        const group2 = await Group.create({
            groupName: 'FYP-S2026-001',
            student1: student3._id,
            student2: student4._id,
            student2Status: 'approved',
            leader: student3._id,
            projectTitle: 'Blockchain Voting System',
            projectDomain: 'Cybersecurity',
            projectSummary: 'A decentralized voting application using Ethereum blockchain to ensure transparency.',
            batch: 'Spring',
            year: 2026,
            batchYear: 2024,
            semester: 7,
            status: 'registered'
        });
        console.log(`✅ Created Group 2: ${group2.groupName}`);


        console.log('⚖️ Creating Defense Panels...');

        const panel1User = getUserByEmail('panel1@lgu.edu.pk');
        const panel2User = getUserByEmail('panel2@lgu.edu.pk');

        const panel1 = await DefensePanel.create({
            panelName: 'PP-2026-F-01',
            panelType: 'proposal',
            members: [supervisor1._id, panel1User._id, panel2User._id],
            chairperson: supervisor1._id, // Supervisor acting as chair for example
            academicYear: '2026',
            batch: 'Fall',
            semester: 7,
            createdBy: coordinator._id,
            assignedGroups: [group1._id]
        });

        // Update group with panel
        group1.proposalPanel = panel1._id;
        await group1.save();

        console.log(`✅ Created Defense Panel: ${panel1.panelName}`);


        console.log('\n✨ Database seeded successfully!\n');

        console.log('📋 Sample Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Coordinator: coordinator@lgu.edu.pk');
        console.log('Supervisor:  supervisor1@lgu.edu.pk');
        console.log('Student (Fall, Leader): student1@lgu.edu.pk');
        console.log('Student (Spring, Leader): student3@lgu.edu.pk');
        console.log('Password for all: password123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run seeder
seedDatabase();
