import xlsx from 'xlsx';

const workbook = xlsx.readFile('./4th Semester (1).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Headers:", data[0]);
console.log("First row:", data[1]);
console.log("Total rows:", data.length);
