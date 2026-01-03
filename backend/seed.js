
import mongoose from "mongoose";
import dotenv from "dotenv";
import Employee from "./model/employ.js";
import EmployeeProfile from "./model/employ-profile.js";
import Leave from "./model/leave.js";
import Payroll from "./model/payroll.js";

dotenv.config();

// Dummy data generator
const DUMMY_DATA = [
  { firstName: "John", lastName: "Doe", email: "2024johndoe001@iitjammu.ac.in", department: "Engineering", position: "Backend Developer", image: "https://randomuser.me/api/portraits/men/1.jpg" },
  { firstName: "Priya", lastName: "Sharma", email: "2024priyasharma002@iitjammu.ac.in", department: "Marketing", position: "Marketing Manager", image: "https://randomuser.me/api/portraits/women/2.jpg" },
  { firstName: "Rohan", lastName: "Singh", email: "2024rohansingh003@iitjammu.ac.in", department: "Sales", position: "Sales Executive", image: "https://randomuser.me/api/portraits/men/3.jpg" },
  { firstName: "Sneha", lastName: "Gupta", email: "2024snehagupta004@iitjammu.ac.in", department: "HR", position: "HR Specialist", image: "https://randomuser.me/api/portraits/women/4.jpg" },
  { firstName: "Vikram", lastName: "Malhotra", email: "2024vikrammalhotra005@iitjammu.ac.in", department: "Finance", position: "Accountant", image: "https://randomuser.me/api/portraits/men/5.jpg" },
  { firstName: "Ananya", lastName: "Das", email: "2024ananyadas006@iitjammu.ac.in", department: "Operations", position: "Operations Manager", image: "https://randomuser.me/api/portraits/women/6.jpg" },
  { firstName: "Rahul", lastName: "Verma", email: "2024rahulverma007@iitjammu.ac.in", department: "IT", position: "System Administrator", image: "https://randomuser.me/api/portraits/men/7.jpg" },
  { firstName: "Ishita", lastName: "Reddy", email: "2024ishitareddy008@iitjammu.ac.in", department: "Engineering", position: "Frontend Developer", image: "https://randomuser.me/api/portraits/women/8.jpg" }
];

const generateEmployeeId = (firstName, lastName, year, serial) => {
  const f2 = firstName.substring(0, 2).toUpperCase();
  const l2 = lastName.substring(0, 2).toUpperCase();
  const ser = serial.toString().padStart(4, '0');
  return `OI${f2}${l2}${year}${ser}`;
};

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅ Database Connected for Seeding");

        // Clear existing data
        await Employee.deleteMany({ role: { $ne: 'admin' } });
        await EmployeeProfile.deleteMany({});
        await Leave.deleteMany({});
        await Payroll.deleteMany({});
        console.log("Deleted existing dummy data");

        let serial = 1;
        const currentYear = new Date().getFullYear();

        for (const data of DUMMY_DATA) {
            const employeeId = generateEmployeeId(data.firstName, data.lastName, currentYear, serial++);
            const fullName = `${data.firstName} ${data.lastName}`;

            // Create user account
            const employee = await Employee.create({
                Employname: fullName,
                email: data.email,
                password: "password123",
                employeeId: employeeId,
                department: data.department,
                position: data.position,
                image: data.image,
                role: "employee",
                isVerified: true,
                status: "active",
                joiningDate: new Date()
            });

            // Create profile with salary
            await EmployeeProfile.create({
                employee: employee._id,
                phone: "9876543210",
                address: "Sample Address, City",
                profilePicture: data.image,
                nationality: "Indian",
                personalEmail: data.email,
                gender: "other",
                jobDetails: {
                    designation: data.position,
                    department: data.department,
                    joiningDate: new Date(),
                    employmentType: "full-time"
                },
                salaryStructure: {
                    basic: 50000,
                    hra: 20000,
                    allowances: 10000,
                    pfContribution: 2000,
                    professionalTax: 200,
                    netSalary: 77800,
                    workingDays: 22
                }
            });

            // Create Payroll Record
            await Payroll.create({
                employeeId: employee._id,
                month: new Date().getMonth() + 1, // Current month
                year: currentYear,
                basic: 50000,
                allowances: { hra: 20000, transport: 5000, medical: 2000, special: 3000 },
                deductions: { tax: 1000, pf: 2000, insurance: 500 },
                status: "paid",
                workingDays: 22,
                presentDays: 20,
                paidOn: new Date()
            });

            // Random Leave Creation
            if (Math.random() > 0.5) {
                const leaveStatus = ["pending", "approved", "rejected"][Math.floor(Math.random() * 3)];
                const leaveType = ["paid", "sick", "unpaid"][Math.floor(Math.random() * 3)];
                const startDate = new Date();
                startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 10));
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 2);

                await Leave.create({
                    employeeId: employee._id,
                    type: leaveType,
                    startDate: startDate,
                    endDate: endDate,
                    reason: "Personal reasons",
                    status: leaveStatus,
                    duration: 3
                });
            }

            console.log(`Created: ${fullName} (${employeeId})`);
        }

        console.log("✅ Seeding Completed!");
        process.exit();
    } catch (error) {
        console.error("❌ Seeding Error:", error);
        process.exit(1);
    }
};

seedData();
