CAMCARE: Integrated Management System
Enterprise Frontend Version: Optimized for Speed & Universal Access

CAMCARE คือระบบบริหารจัดการองค์กรแบบครบวงจร (Integrated Management System) ที่ออกแบบมาเพื่อรองรับงานหน้าบ้าน (Frontend) สำหรับจัดการแจ้งซ่อม, งานติดตั้ง, เคลมสินค้า, ยืม-คืนอุปกรณ์, คลังสินค้า และระบบจัดการกล้อง CCTV โดยเน้นความเร็วในการทำงาน (Turbo Speed) และการแสดงผลที่สมบูรณ์แบบบนทุกอุปกรณ์ (Desktop, iPad, Mobile)

🚀 Key Features
1.Performance-First: ระบบประมวลผลรูปภาพแบบ Parallel Processing (บีบอัดภาพพร้อมกันหลายไฟล์) ทำให้การบันทึกงานรวดเร็วระดับวินาที
2.Universal Print & Export: แก้ไขปัญหาการ Print / Export PDF บน iOS และ Desktop ให้แสดงผลสวยงามและรวดเร็ว
3.Responsive UI: จัดการ Layout ด้วย Tailwind CSS รองรับทุกขนาดหน้าจอ พร้อมระบบ modal ที่เลื่อนได้อิสระบนมือถือ
4.Advanced CCTV Management: ระบบจัดการกล้อง CCTV พร้อมแผนที่ (Leaflet) ปักหมุดพิกัด และระบบ Filter อัจฉริยะ
5.Real-time Notifications: ระบบแจ้งเตือนงานค้างสำหรับ Admin และพนักงาน
6.Role-Based Access: ระบบจัดการสิทธิ์การเข้าถึง (Admin, Employee, User)
7.Lightbox Gallery: ระบบดูรูปภาพแบบ Gallery เลื่อนซ้าย-ขวาได้ พร้อมความละเอียดที่คมชัดแต่ขนาดไฟล์เบาบาง

🛠 Tech Stack
1.UI Framework: React (via Babel/CDN)
2.Styling: Tailwind CSS
3.Maps: Leaflet.js
4.Data Export: SheetJS (XLSX)
5.Icons: FontAwesome 6

📂 Project Structure (Overview)
1.index.html: ไฟล์หลักที่รวมโครงสร้างทั้งหมด
- CCTVMap Component: จัดการแสดงผลแผนที่และกล้อง
- DataDashboard: คอมโพเนนต์อัจฉริยะที่ใช้จัดการ Table, Filter, และ Export ข้อมูลในระบบ
- ManageItemModal: ศูนย์รวมการจัดการแก้ไขข้อมูลงาน, อัปโหลดไฟล์, และระบบ Chat
- AdvancedFileUploader: ตัวจัดการไฟล์พร้อมระบบบีบอัดรูปภาพ (Compressor) ในตัว
- Utilities: ฟังก์ชันจัดการไฟล์ Base64, Print, และ Sync ข้อมูล

⚙️ How to Deploy
1. Google Apps Script: โค้ดนี้ถูกออกแบบมาเพื่อทำงานร่วมกับ Backend ของ Google Apps Script (Code.gs)
2. Setup: ตรวจสอบให้แน่ใจว่า API endpoint ในฟังก์ชัน `refreshData` และ `handleOptimisticSync` ตรงกับที่ตั้งไว้ใน Google Apps Script
3. Data Sync: ระบบใช้หลักการ `handleOptimisticSync` เพื่ออัปเดตหน้าจอให้ผู้ใช้ทันที (Immediate Feedback) ก่อนที่ข้อมูลจะส่งไปถึง Server

💡 Performance Optimization Notes
1.Image Compression: ระบบใช้ `Canvas API` ในการบีบอัดรูปภาพก่อนส่งออกเป็น Base64 ทำให้ไฟล์มีขนาดเล็กมาก แม้อัปโหลดพร้อมกันหลายไฟล์ก็ไม่ทำให้ Browser ค้าง
2.Parallel Processing: การใช้ `Promise.all` ช่วยให้การส่งไฟล์งานทำได้เร็วกว่าระบบ Loop แบบเดิม 5-10 เท่า
3.Print Bypass: ใช้ CSS `@media print` ร่วมกับการสร้าง Temporary Window เพื่อตัดปัญหาการติดค้างของสไตล์ CSS บนเบราว์เซอร์แต่ละประเภท

📝 Change Log (Latest Updates)
1. [v.2.0.0] ปรับปรุง Modal จัดการผู้ใช้งานให้รองรับการเลื่อนบนหน้าจอขนาดเล็ก
2. [v.2.0.1] เพิ่มระบบ Gallery สำหรับดูรูปภาพงาน
3. [v.2.0.2] ปรับปรุงระบบบันทึกงานให้รองรับไฟล์ขนาดสูงสุด 10MB พร้อมการบีบอัดภาพแบบ Parallel
4. [v.2.0.3] แก้ไขบั๊กการพิมพ์ PDF และการแสดงผลฟอร์มซ้อนทับกัน

#เพิ่มเติม
หากคุณต้องการพัฒนาคนอื่นต่อ 
1. ควรแยกไฟล์ `.js` และ `.css` ออกจาก `index.html` เพื่อให้จัดการโค้ดง่ายขึ้นในอนาคต (ถ้าเริ่มมีจำนวนบรรทัดเยอะเกิน 2,000 บรรทัด)
2. หากมีการใช้งานในสเกลใหญ่ แนะนำให้ย้ายจาก `React via CDN` ไปเป็น `React Build` ด้วย Vite เพื่อให้ไฟล์มีขนาดเล็กลงไปอีกครับ
   
