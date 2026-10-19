import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing SemesterOS with clean slate (Zero dummy/pseudo data)...");

  // 1. Clean all existing tables completely
  await prisma.aIMessage.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.revisionItem.deleteMany({});
  await prisma.studySession.deleteMany({});
  await prisma.studyGoal.deleteMany({});
  await prisma.labExperiment.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  await prisma.timetableEntry.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.subject.deleteMany({});

  // 2. Clean Academic Profile (no dummy personal data)
  await prisma.academicProfile.upsert({
    where: { id: "default-profile" },
    update: {
      name: "Student",
      degree: "Engineering Degree",
      institution: "My University / College",
      rollNumber: "",
      targetCgpa: 8.5,
      currentCgpa: 0.0,
    },
    create: {
      id: "default-profile",
      name: "Student",
      degree: "Engineering Degree",
      institution: "My University / College",
      rollNumber: "",
      targetCgpa: 8.5,
      currentCgpa: 0.0,
    },
  });

  // 3. Initialize all 8 Semesters (structure ready for student configuration)
  const currentYear = new Date().getFullYear();
  const semesterNames = [
    { id: 1, name: "Semester 1", academicYear: `${currentYear} - ${currentYear + 1}`, isCurrent: true, sgpa: 0.0, credits: 0 },
    { id: 2, name: "Semester 2", academicYear: `${currentYear} - ${currentYear + 1}`, isCurrent: false, sgpa: 0.0, credits: 0 },
    { id: 3, name: "Semester 3", academicYear: `${currentYear + 1} - ${currentYear + 2}`, isCurrent: false, sgpa: 0.0, credits: 0 },
    { id: 4, name: "Semester 4", academicYear: `${currentYear + 1} - ${currentYear + 2}`, isCurrent: false, sgpa: 0.0, credits: 0 },
    { id: 5, name: "Semester 5", academicYear: `${currentYear + 2} - ${currentYear + 3}`, isCurrent: false, sgpa: 0.0, credits: 0 },
    { id: 6, name: "Semester 6", academicYear: `${currentYear + 2} - ${currentYear + 3}`, isCurrent: false, sgpa: 0.0, credits: 0 },
    { id: 7, name: "Semester 7", academicYear: `${currentYear + 3} - ${currentYear + 4}`, isCurrent: false, sgpa: 0.0, credits: 0 },
    { id: 8, name: "Semester 8", academicYear: `${currentYear + 3} - ${currentYear + 4}`, isCurrent: false, sgpa: 0.0, credits: 0 },
  ];

  for (const sem of semesterNames) {
    await prisma.semester.upsert({
      where: { id: sem.id },
      update: {
        name: sem.name,
        academicYear: sem.academicYear,
        isCurrent: sem.isCurrent,
        sgpa: 0.0,
        credits: 0,
      },
      create: sem,
    });
  }

  // 4. Default App Settings
  await prisma.appSettings.upsert({
    where: { id: "default-settings" },
    update: {
      attendanceThreshold: 75.0,
      countCancelledAsConducted: false,
      gradeScheme: "STANDARD_10_POINT",
      ollamaUrl: "http://localhost:11434",
      ollamaModel: "llama3.1:latest",
      darkMode: false,
    },
    create: {
      id: "default-settings",
      attendanceThreshold: 75.0,
      countCancelledAsConducted: false,
      gradeScheme: "STANDARD_10_POINT",
      ollamaUrl: "http://localhost:11434",
      ollamaModel: "llama3.1:latest",
      darkMode: false,
    },
  });

  console.log("SemesterOS initialized with zero pseudo data. Clean slate ready for user input!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
