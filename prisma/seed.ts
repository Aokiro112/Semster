import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SemesterOS database with authentic engineering curriculum...");

  // 1. Academic Profile
  await prisma.academicProfile.upsert({
    where: { id: "default-profile" },
    update: {},
    create: {
      id: "default-profile",
      name: "Alex Mercer",
      degree: "B.Tech Computer Science & Engineering",
      institution: "National Institute of Technology",
      rollNumber: "24CS1042",
      targetCgpa: 8.5,
      currentCgpa: 7.8,
    },
  });

  // 2. Semesters 1 to 8
  const semesterNames = [
    { id: 1, name: "Semester 1", academicYear: "2024 - 2025", isCurrent: true, sgpa: 7.8, credits: 20 },
    { id: 2, name: "Semester 2", academicYear: "2024 - 2025", isCurrent: false, sgpa: 8.1, credits: 21 },
    { id: 3, name: "Semester 3", academicYear: "2025 - 2026", isCurrent: false, sgpa: 0.0, credits: 22 },
    { id: 4, name: "Semester 4", academicYear: "2025 - 2026", isCurrent: false, sgpa: 0.0, credits: 22 },
    { id: 5, name: "Semester 5", academicYear: "2026 - 2027", isCurrent: false, sgpa: 0.0, credits: 20 },
    { id: 6, name: "Semester 6", academicYear: "2026 - 2027", isCurrent: false, sgpa: 0.0, credits: 20 },
    { id: 7, name: "Semester 7", academicYear: "2027 - 2028", isCurrent: false, sgpa: 0.0, credits: 18 },
    { id: 8, name: "Semester 8", academicYear: "2027 - 2028", isCurrent: false, sgpa: 0.0, credits: 16 },
  ];

  for (const sem of semesterNames) {
    await prisma.semester.upsert({
      where: { id: sem.id },
      update: {
        name: sem.name,
        academicYear: sem.academicYear,
        isCurrent: sem.isCurrent,
        sgpa: sem.sgpa,
        credits: sem.credits,
      },
      create: sem,
    });
  }

  // 3. Subjects for Semester 1
  const subjectsData = [
    {
      code: "MA101",
      name: "Engineering Mathematics",
      credits: 4,
      instructor: "Dr. Sharma",
      courseType: "Theory",
      color: "#18181b",
      semesterId: 1,
    },
    {
      code: "PH101",
      name: "Physics",
      credits: 4,
      instructor: "Dr. Mehta",
      courseType: "Theory & Lab",
      color: "#27272a",
      semesterId: 1,
    },
    {
      code: "CS101",
      name: "Programming for Problem Solving",
      credits: 4,
      instructor: "Dr. Verma",
      courseType: "Theory & Lab",
      color: "#3f3f46",
      semesterId: 1,
    },
    {
      code: "EE101",
      name: "Basic Electrical Engineering",
      credits: 3,
      instructor: "Dr. Rao",
      courseType: "Theory & Lab",
      color: "#52525b",
      semesterId: 1,
    },
    {
      code: "CH101",
      name: "Chemistry",
      credits: 3,
      instructor: "Dr. Sen",
      courseType: "Theory",
      color: "#71717a",
      semesterId: 1,
    },
  ];

  // Remove existing subjects in semester 1 to allow clean idempotent re-seeding
  await prisma.subject.deleteMany({ where: { semesterId: 1 } });

  const createdSubjects: Record<string, string> = {};

  for (const sub of subjectsData) {
    const created = await prisma.subject.create({
      data: sub,
    });
    createdSubjects[sub.code] = created.id;
  }

  // 4. Modules & Topics for Engineering Mathematics
  const mathMod1 = await prisma.module.create({
    data: {
      name: "Module 1: Matrices",
      orderIndex: 1,
      subjectId: createdSubjects["MA101"],
      topics: {
        create: [
          { title: "Introduction to Matrices", orderIndex: 1, status: "COMPLETED" },
          { title: "Types of Matrices", orderIndex: 2, status: "COMPLETED" },
          { title: "Matrix Operations", orderIndex: 3, status: "NOT_STARTED" },
          { title: "Inverse of a Matrix", orderIndex: 4, status: "NEEDS_REVISION" },
        ],
      },
    },
  });

  await prisma.module.create({
    data: {
      name: "Module 2: Differential Calculus",
      orderIndex: 2,
      subjectId: createdSubjects["MA101"],
      topics: {
        create: [
          { title: "Limits and Continuity", orderIndex: 1, status: "COMPLETED" },
          { title: "Partial Differentiation", orderIndex: 2, status: "LEARNING" },
          { title: "Euler's Theorem on Homogeneous Functions", orderIndex: 3, status: "NOT_STARTED" },
          { title: "Jacobians and Maxima/Minima", orderIndex: 4, status: "NOT_STARTED" },
        ],
      },
    },
  });

  await prisma.module.create({
    data: {
      name: "Module 3: Integral Calculus",
      orderIndex: 3,
      subjectId: createdSubjects["MA101"],
      topics: {
        create: [
          { title: "Double and Triple Integrals", orderIndex: 1, status: "NOT_STARTED" },
          { title: "Beta and Gamma Functions", orderIndex: 2, status: "NOT_STARTED" },
          { title: "Green's and Gauss Divergence Theorems", orderIndex: 3, status: "NOT_STARTED" },
        ],
      },
    },
  });

  // Modules for Physics
  await prisma.module.create({
    data: {
      name: "Module 1: Wave Optics",
      orderIndex: 1,
      subjectId: createdSubjects["PH101"],
      topics: {
        create: [
          { title: "Interference of Light & Thin Films", orderIndex: 1, status: "COMPLETED" },
          { title: "Diffraction - Fraunhofer & Fresnel", orderIndex: 2, status: "COMPLETED" },
          { title: "Polarization and Brewster's Law", orderIndex: 3, status: "LEARNING" },
        ],
      },
    },
  });

  // Modules for Programming
  await prisma.module.create({
    data: {
      name: "Module 1: Algorithms & C Control Structures",
      orderIndex: 1,
      subjectId: createdSubjects["CS101"],
      topics: {
        create: [
          { title: "Data Types and Operators", orderIndex: 1, status: "COMPLETED" },
          { title: "Control Flow: Loops and Branches", orderIndex: 2, status: "COMPLETED" },
          { title: "Arrays and Multi-dimensional Grids", orderIndex: 3, status: "COMPLETED" },
          { title: "Pointers and Dynamic Memory Allocation", orderIndex: 4, status: "LEARNING" },
        ],
      },
    },
  });

  // 5. Timetable Entries
  const timetable = [
    { day: "MON", start: "08:30", end: "09:30", sub: "MA101", room: "L-101", inst: "Dr. Sharma", type: "LECTURE" },
    { day: "MON", start: "09:45", end: "10:45", sub: "PH101", room: "L-102", inst: "Dr. Mehta", type: "LECTURE" },
    { day: "MON", start: "11:00", end: "12:00", sub: "CS101", room: "L-201", inst: "Dr. Verma", type: "LECTURE" },
    { day: "MON", start: "14:00", end: "16:00", sub: "PH101", room: "Lab 1", inst: "Dr. Mehta", type: "LAB" },

    { day: "TUE", start: "09:00", end: "10:00", sub: "PH101", room: "L-102", inst: "Dr. Mehta", type: "LECTURE" },
    { day: "TUE", start: "10:00", end: "11:00", sub: "EE101", room: "L-105", inst: "Dr. Rao", type: "LECTURE" },
    { day: "TUE", start: "14:00", end: "16:00", sub: "CS101", room: "Lab 2", inst: "Dr. Verma", type: "LAB" },

    { day: "WED", start: "08:30", end: "09:30", sub: "MA101", room: "L-101", inst: "Dr. Sharma", type: "LECTURE" },
    { day: "WED", start: "10:00", end: "11:00", sub: "CS101", room: "L-201", inst: "Dr. Verma", type: "LECTURE" },
    { day: "WED", start: "14:00", end: "16:00", sub: "EE101", room: "Lab 3", inst: "Dr. Rao", type: "LAB" },

    { day: "THU", start: "09:00", end: "10:00", sub: "PH101", room: "L-102", inst: "Dr. Mehta", type: "LECTURE" },
    { day: "THU", start: "10:00", end: "11:00", sub: "EE101", room: "L-105", inst: "Dr. Rao", type: "LECTURE" },

    { day: "FRI", start: "08:30", end: "09:30", sub: "MA101", room: "L-101", inst: "Dr. Sharma", type: "LECTURE" },
    { day: "FRI", start: "10:00", end: "11:00", sub: "CH101", room: "L-103", inst: "Dr. Sen", type: "LECTURE" },
  ];

  for (const t of timetable) {
    await prisma.timetableEntry.create({
      data: {
        dayOfWeek: t.day,
        startTime: t.start,
        endTime: t.end,
        room: t.room,
        instructor: t.inst,
        sessionType: t.type,
        subjectId: createdSubjects[t.sub],
        semesterId: 1,
      },
    });
  }

  // 6. Attendance Records
  // Mathematics: 24 attended, 6 missed (80%)
  for (let i = 0; i < 30; i++) {
    const isAttended = i < 24;
    await prisma.attendanceRecord.create({
      data: {
        date: new Date(Date.now() - (30 - i) * 86400000 * 1.5),
        status: isAttended ? "ATTENDED" : "MISSED",
        sessionType: "LECTURE",
        subjectId: createdSubjects["MA101"],
      },
    });
  }

  // Physics: 22 attended, 8 missed (73.3% - Warning)
  for (let i = 0; i < 30; i++) {
    const isAttended = i < 22;
    await prisma.attendanceRecord.create({
      data: {
        date: new Date(Date.now() - (30 - i) * 86400000 * 1.5),
        status: isAttended ? "ATTENDED" : "MISSED",
        sessionType: "LECTURE",
        subjectId: createdSubjects["PH101"],
      },
    });
  }

  // Programming: 26 attended, 4 missed (86.7% - Good)
  for (let i = 0; i < 30; i++) {
    const isAttended = i < 26;
    await prisma.attendanceRecord.create({
      data: {
        date: new Date(Date.now() - (30 - i) * 86400000 * 1.5),
        status: isAttended ? "ATTENDED" : "MISSED",
        sessionType: "LECTURE",
        subjectId: createdSubjects["CS101"],
      },
    });
  }

  // Electrical: 19 attended, 6 missed (76.0% - Good)
  for (let i = 0; i < 25; i++) {
    const isAttended = i < 19;
    await prisma.attendanceRecord.create({
      data: {
        date: new Date(Date.now() - (25 - i) * 86400000 * 1.5),
        status: isAttended ? "ATTENDED" : "MISSED",
        sessionType: "LECTURE",
        subjectId: createdSubjects["EE101"],
      },
    });
  }

  // Chemistry: 17 attended, 8 missed (68.0% - Warning)
  for (let i = 0; i < 25; i++) {
    const isAttended = i < 17;
    await prisma.attendanceRecord.create({
      data: {
        date: new Date(Date.now() - (25 - i) * 86400000 * 1.5),
        status: isAttended ? "ATTENDED" : "MISSED",
        sessionType: "LECTURE",
        subjectId: createdSubjects["CH101"],
      },
    });
  }

  // 7. Tasks & Assignments
  const tasks = [
    {
      title: "Assignment 1 - PPSD",
      description: "Implement 5 sorting algorithms in C and benchmark execution times.",
      dueDate: new Date(Date.now() + 2 * 86400000),
      priority: "HIGH",
      status: "TODO",
      taskType: "ASSIGNMENT",
      sub: "CS101",
    },
    {
      title: "Lab Report 2 - Newton's Rings",
      description: "Calculate radius of curvature of plano-convex lens with error analysis.",
      dueDate: new Date(Date.now() + 4 * 86400000),
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      taskType: "LAB_REPORT",
      sub: "PH101",
    },
    {
      title: "Numerical Sheet 3 - Eigenvalues",
      description: "Solve problems 1-15 on Cayley-Hamilton theorem and diagonalizability.",
      dueDate: new Date(Date.now() + 6 * 86400000),
      priority: "MEDIUM",
      status: "TODO",
      taskType: "ASSIGNMENT",
      sub: "MA101",
    },
    {
      title: "Circuit Diagram Submission",
      description: "Draw circuit schematics for 3-phase star and delta connections in Proteus/SPICE.",
      dueDate: new Date(Date.now() + 8 * 86400000),
      priority: "LOW",
      status: "TODO",
      taskType: "ASSIGNMENT",
      sub: "EE101",
    },
    {
      title: "Quiz Preparation - Thermodynamics",
      description: "Revise Hess's Law and entropy calculations.",
      dueDate: new Date(Date.now() + 10 * 86400000),
      priority: "LOW",
      status: "IN_PROGRESS",
      taskType: "QUIZ",
      sub: "CH101",
    },
    {
      title: "Lab Viva Preparation - Dynamic Memory",
      description: "Prepare malloc, calloc, realloc, and free memory leak interview questions.",
      dueDate: new Date(Date.now() + 12 * 86400000),
      priority: "HIGH",
      status: "TODO",
      taskType: "STUDY_TASK",
      sub: "CS101",
    },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
        taskType: t.taskType,
        subjectId: createdSubjects[t.sub],
        semesterId: 1,
      },
    });
  }

  // 8. Assessments & Examinations
  const assessments = [
    {
      title: "Quiz 1 - Mathematics",
      assessmentType: "QUIZ",
      maxMarks: 20,
      marksObtained: 16,
      weightage: 10,
      date: new Date(Date.now() - 14 * 86400000),
      sub: "MA101",
    },
    {
      title: "Assignment 1 - Programming",
      assessmentType: "ASSIGNMENT",
      maxMarks: 50,
      marksObtained: 42,
      weightage: 20,
      date: new Date(Date.now() - 7 * 86400000),
      sub: "CS101",
    },
    {
      title: "Mid Sem 1 - Mathematics",
      assessmentType: "MID_SEM",
      maxMarks: 30,
      marksObtained: 24,
      weightage: 20,
      date: new Date(Date.now() + 5 * 86400000),
      sub: "MA101",
    },
    {
      title: "Mid Sem 1 - Physics",
      assessmentType: "MID_SEM",
      maxMarks: 30,
      marksObtained: null,
      weightage: 20,
      date: new Date(Date.now() + 7 * 86400000),
      sub: "PH101",
    },
    {
      title: "Mid Sem 1 - Programming",
      assessmentType: "MID_SEM",
      maxMarks: 30,
      marksObtained: null,
      weightage: 20,
      date: new Date(Date.now() + 9 * 86400000),
      sub: "CS101",
    },
    {
      title: "Lab Internal - Electrical",
      assessmentType: "LAB_INTERNAL",
      maxMarks: 30,
      marksObtained: 26,
      weightage: 20,
      date: new Date(Date.now() - 3 * 86400000),
      sub: "EE101",
    },
    {
      title: "End Sem - Mathematics",
      assessmentType: "END_SEM",
      maxMarks: 70,
      marksObtained: null,
      weightage: 40,
      date: new Date(Date.now() + 45 * 86400000),
      sub: "MA101",
    },
  ];

  for (const a of assessments) {
    await prisma.assessment.create({
      data: {
        title: a.title,
        assessmentType: a.assessmentType,
        maxMarks: a.maxMarks,
        marksObtained: a.marksObtained,
        weightage: a.weightage,
        date: a.date,
        subjectId: createdSubjects[a.sub],
        semesterId: 1,
      },
    });
  }

  // 9. Lab Experiments
  await prisma.labExperiment.create({
    data: {
      experimentNumber: 1,
      title: "Determination of Wavelength of Sodium Light by Newton's Rings",
      subjectId: createdSubjects["PH101"],
      aim: "To determine the wavelength of sodium light using Newton's rings method and calculate the radius of curvature.",
      apparatus: "Plano-convex lens, flat glass plate, traveling microscope, sodium light source, condensing lens, 45-degree glass plate.",
      theory: "Newton's rings are formed as a result of interference between light waves reflected from the upper and lower surfaces of the air film formed between a curved lens and flat glass plate. The diameter of the m-th dark ring is given by: D_m^2 = 4m \\lambda R.",
      procedure: "1. Clean the lens and plate. 2. Align microscope. 3. Focus on interference rings. 4. Record left and right tangential crosshair coordinates for rings 1 to 20.",
      observations: "Ring 20 Left = 4.522 cm, Right = 3.910 cm; Ring 10 Left = 4.312 cm, Right = 4.120 cm.",
      calculations: "\\lambda = \\frac{D_{n+p}^2 - D_n^2}{4p R} = \\frac{(0.612)^2 - (0.192)^2}{4 \\times 10 \\times 100} \\approx 5893 \\text{ \\AA}.",
      result: "Wavelength of sodium light determined experimentally is 589.3 nm with 0.8% error.",
      vivaQuestions: JSON.stringify([
        { q: "Why is the central spot dark in reflected light?", a: "Due to an additional phase shift of pi (path difference lambda/2) upon reflection from the denser flat glass surface." },
        { q: "What happens if a liquid is introduced between the lens and plate?", a: "The rings contract because the refractive index mu > 1 reduces the optical path." }
      ]),
      codeSnippet: "lambda_val = (D20**2 - D10**2) / (4 * 10 * R)\nprint(f'Wavelength: {lambda_val*1e10:.1f} Angstroms')",
      status: "COMPLETED",
    },
  });

  await prisma.labExperiment.create({
    data: {
      experimentNumber: 1,
      title: "Matrix Multiplication in C using Dynamic Memory",
      subjectId: createdSubjects["CS101"],
      aim: "To implement dynamic memory allocation using malloc for two 2D matrices and compute their product efficiently.",
      apparatus: "GCC compiler 14.x, GDB debugger, Linux OS.",
      theory: "For matrices A (m x k) and B (k x n), the resultant matrix C has dimensions (m x n). Each element C[i][j] is the inner product of the i-th row of A and the j-th column of B.",
      procedure: "1. Prompt user for rows and columns. 2. Validate condition colsA == rowsB. 3. Allocate memory using int** ptr = malloc(...). 4. Populate matrices. 5. Multiply. 6. Free allocated memory.",
      result: "Matrix multiplication executed with O(m*k*n) time complexity and zero memory leaks verified by Valgrind.",
      vivaQuestions: JSON.stringify([
        { q: "What is the difference between malloc() and calloc()?", a: "malloc allocates uninitialized memory while calloc initializes all allocated bytes to zero." },
        { q: "What happens if free() is not called?", a: "Memory leak occurs; heap space remains occupied until the operating system terminates the process." }
      ]),
      codeSnippet: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int r1 = 2, c1 = 2, r2 = 2, c2 = 2;
    int **A = malloc(r1 * sizeof(int*));
    for(int i=0; i<r1; i++) A[i] = malloc(c1 * sizeof(int));
    // Multiply and free
    return 0;
}`,
      status: "COMPLETED",
    },
  });

  // 10. Study Goals & Sessions for Today
  await prisma.studyGoal.createMany({
    data: [
      { title: "Study Matrices (2 hrs)", targetDate: new Date(), completed: true, semesterId: 1, durationEstMinutes: 120 },
      { title: "Complete PPSD Assignment", targetDate: new Date(), completed: true, semesterId: 1, durationEstMinutes: 45 },
      { title: "Revise Physics - Unit 1", targetDate: new Date(), completed: false, semesterId: 1, durationEstMinutes: 30 },
      { title: "Lab Report Writing", targetDate: new Date(), completed: false, semesterId: 1, durationEstMinutes: 40 },
      { title: "Read 20 pages (Chemistry)", targetDate: new Date(), completed: false, semesterId: 1, durationEstMinutes: 25 },
    ],
  });

  // Today's Study Sessions (Pomodoro) matching Screenshot 1
  await prisma.studySession.create({
    data: {
      durationMinutes: 25,
      sessionType: "READING",
      notes: "Matrices - Concept Reading (Module 1)",
      subjectId: createdSubjects["MA101"],
    },
  });

  await prisma.studySession.create({
    data: {
      durationMinutes: 25,
      sessionType: "PROBLEM_SOLVING",
      notes: "Matrices - Practice Questions",
      subjectId: createdSubjects["MA101"],
    },
  });

  // Past 6 days study sessions for Pomodoro chart
  const daysAgo = [6, 5, 4, 3, 2, 1];
  const minutes = [90, 160, 210, 140, 95, 100];
  for (let i = 0; i < daysAgo.length; i++) {
    await prisma.studySession.create({
      data: {
        durationMinutes: minutes[i],
        sessionType: "DEEP_WORK",
        notes: "Historical session",
        date: new Date(Date.now() - daysAgo[i] * 86400000),
        subjectId: createdSubjects["MA101"],
      },
    });
  }

  // 11. Notes & Academic Vault
  await prisma.note.create({
    data: {
      title: "Derivatives - Important Formulas",
      folder: "Formulas",
      tags: "Mathematics,Calculus,Formulas",
      isBookmarked: true,
      subjectId: createdSubjects["MA101"],
      semesterId: 1,
      content: `### Basic Derivative Formulas

$$\\frac{d}{dx}(x^n) = n x^{n-1}$$

$$\\frac{d}{dx}(\\sin x) = \\cos x$$

$$\\frac{d}{dx}(\\cos x) = -\\sin x$$

$$\\frac{d}{dx}(e^x) = e^x$$

$$\\frac{d}{dx}(\\ln x) = \\frac{1}{x}$$

### Chain Rule
If $y = f(g(x))$, then:
$$\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$$

### Product Rule
$$\\frac{d}{dx}[u \\cdot v] = u \\frac{dv}{dx} + v \\frac{du}{dx}$$
`,
    },
  });

  // 12. App Settings
  await prisma.appSettings.upsert({
    where: { id: "default-settings" },
    update: {},
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

  console.log("SemesterOS database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
