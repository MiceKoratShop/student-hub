# 🚀 คู่มือการนำระบบไปใช้งานบน GitHub Pages & Netlify

ระบบ **Classroom Student Hub** ถูกออกแบบให้สามารถนำไปติดตั้งบน **GitHub Pages** หรือ **Netlify** ได้ฟรี 100% เชื่อมต่อฐานข้อมูล **Google Sheets** และ **Google Drive** แบบ Real-time ทันที!

---

## 🌟 วิธีที่ 1: นำขึ้น GitHub Pages (ฟรี 100% ไม่มีหมดอายุ)

### 📌 ขั้นตอนการอัปโหลดผ่านหน้าเว็บ GitHub (ง่ายที่สุด ไม่ต้องติดตั้งโปรแกรม):

1. **สร้าง Repository ใหม่:**
   - เข้าสู่ระบบที่ [github.com](https://github.com)
   - กดปุ่ม **"New"** (หรือเครื่องหมาย `+` มุมขวาบน ➔ **New repository**)
   - ตั้งชื่อโปรเจกต์ เช่น `student-hub`
   - เลือก **Public** ➔ กดปุ่มสีเขียว **"Create repository"**

2. **อัปโหลดไฟล์ขึ้น GitHub:**
   - ในหน้า Repository กดปุ่ม **"Add file"** ➔ เลือก **"Upload files"**
   - ลากไฟล์ในโฟลเดอร์นี้ขึ้นไปวาง ได้แก่:
     - `index.html` *(หัวใจสำคัญ)*
     - `favicon.png`
     - `favicon.svg`
     - `Code.gs`
     - `README.md`
   - เลื่อนลงมากดปุ่มสีเขียว **"Commit changes"**

3. **เปิดใช้งาน GitHub Pages:**
   - ไปที่แท็บเมนู **"Settings"** (รูปฟันเฟืองด้านบนของ Repository)
   - ที่แถบเมนูด้านซ้าย เลือก **"Pages"**
   - ในส่วน **Branch**:
     - เปลี่ยนจาก `None` ➔ เลือก **`main`** (หรือ `master`)
     - โฟลเดอร์คงไว้ที่ **`/(root)`**
     - กดปุ่ม **"Save"**

4. **รับลิงก์ใช้งาน:**
   - รอประมาณ 1–2 นาที รีเฟรชหน้า Pages จะปรากฏลิงก์เว็บของคุณ เช่น:
     `https://<your-username>.github.io/student-hub/`
   - สามารถแชร์และเปิดใช้งานได้ทันทีบนคอมพิวเตอร์และมือถือ!

---

## 🌐 วิธีที่ 2: นำขึ้น Netlify (app.netlify.com)

1. เข้าสู่ระบบ [app.netlify.com](https://app.netlify.com)
2. ไปที่เมนู **"Sites"** ➔ ลากโฟลเดอร์ `ระบบเก็บข้อมูลนักศึกษา` ทั้งโฟลเดอร์ไปวางที่ช่อง **"Drag and drop your site output folder here"**
3. Netlify จะสร้างลิงก์เว็บไซต์ให้คุณทันที (เช่น `https://your-site-name.netlify.app`)

---

## 🔗 การเชื่อมต่อ Google Apps Script API Backend
ระบบได้ฝัง URL เชื่อมต่อ Google Apps Script ไว้เป็นค่าเริ่มต้นเรียบร้อยแล้ว:
`https://script.google.com/macros/s/AKfycbxr98wFR-Gru89RNpt_sqXyxQWwoA_wOglWHIZfeHy13cp8q6CS57XqMft2WdnVjerR/exec`

*(หากเข้าสู่ระบบด้วยรหัส Admin `admin888` จะสามารถกดปุ่มตั้งค่า API เพื่อเปลี่ยน URL ใหม่ได้ตลอดเวลา)*

