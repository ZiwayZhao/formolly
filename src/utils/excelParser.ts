
import * as XLSX from 'xlsx';

interface ProgramData {
  school_name: string;
  program_name: string;
}

export const parseExcelFile = (file: File): Promise<ProgramData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];

        if (rows.length < 1) {
          throw new Error("文件为空或格式不正确。");
        }
        
        const schoolNameKeys = ['学校名称', '院校名称', 'school_name'];
        const programNameKeys = ['专业(类)名称', '专业名称', 'program_name'];

        let headerRowIndex = -1;
        let schoolNameIndex = -1;
        let programNameIndex = -1;

        // Search for the header row in the first 10 rows
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const potentialHeader = rows[i].map(h => (typeof h === 'string' ? h.trim() : ''));
          
          let tempSchoolIndex = -1;
          for (const key of schoolNameKeys) {
            const index = potentialHeader.indexOf(key);
            if (index !== -1) {
              tempSchoolIndex = index;
              break;
            }
          }

          let tempProgramIndex = -1;
          for (const key of programNameKeys) {
            const index = potentialHeader.indexOf(key);
            if (index !== -1) {
              tempProgramIndex = index;
              break;
            }
          }

          if (tempSchoolIndex !== -1 && tempProgramIndex !== -1) {
            headerRowIndex = i;
            schoolNameIndex = tempSchoolIndex;
            programNameIndex = tempProgramIndex;
            break; // Found header row
          }
        }

        if (headerRowIndex === -1) {
          throw new Error("无法在文件中定位到包含'学校名称'/'院校名称'和'专业(类)名称'/'专业名称'的标题行。请检查文件内容和格式。");
        }

        const dataRows = rows.slice(headerRowIndex + 1);

        const extractedData = dataRows.map(row => ({
          school_name: row[schoolNameIndex],
          program_name: row[programNameIndex],
        })).filter(item => item.school_name && item.program_name);

        resolve(extractedData);

      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(new Error("读取文件时发生错误。"));
    };

    reader.readAsArrayBuffer(file);
  });
};
