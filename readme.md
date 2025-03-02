# Kyra 🩺💬  

Kyra is an AI-powered chat web application designed to help patients discuss their diagnoses in a safe and informative environment. Built with a **FastAPI** backend, **Next.js** frontend, and **Supabase** for database management, Kyra provides a seamless and intuitive experience for users seeking clarity about their health.  

---

## 🚀 Tech Stack  

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) – High-performance Python framework for handling API requests.  
- **Frontend**: [Next.js](https://nextjs.org/) – React-based framework for a dynamic and responsive UI.  
- **Database**: [Supabase](https://supabase.com/) – Scalable PostgreSQL database with authentication and real-time features.  

---

## 🎯 Features  

✅ **AI-powered Chat** – Patients can have natural conversations with Kyra about their diagnosis.  
✅ **Secure & Private** – Built with authentication and data privacy in mind.  
✅ **Fast & Scalable** – Optimized backend and frontend for smooth performance.  
✅ **User-friendly Interface** – Designed for accessibility and ease of use.  

---

## 🛠️ Installation & Setup  

### **1. Clone the Repository**  
```sh
git clone https://github.com/yourusername/kyra.git
cd kyra
```

### **2. Backend Setup (FastAPI)**  
#### Create a virtual environment & install dependencies  
```sh
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

#### Run FastAPI server  
```sh
uvicorn backend.main:app --reload
```

API should now be running at `http://127.0.0.1:8000`.

---

### **3. Frontend Setup (Next.js)**  
```sh
cd frontend
npm install
npm run dev
```

Frontend should now be live at `http://localhost:3000`.

---

### **4. Database Setup (Supabase)**  
1. Create a [Supabase](https://supabase.com/) account and project.  
2. Copy your **API URL** and **anon key** from the Supabase dashboard.  
3. Create a `.env.local` file in the `frontend/` directory and add:  
   ```sh
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```
4. Ensure the database schema is set up correctly using the provided SQL scripts in `/database`.

---

## 📌 Roadmap  

- [ ] Improve AI response accuracy.  
- [ ] Add multilingual support.  
- [ ] Implement patient history tracking.  
- [ ] Enhance UI/UX for better accessibility.  

---

## 🤝 Contributing  

Contributions are welcome! To contribute:  
1. Fork the repository.  
2. Create a new branch (`git checkout -b feature-branch`).  
3. Commit your changes (`git commit -m "Add new feature"`).  
4. Push to the branch (`git push origin feature-branch`).  
5. Open a Pull Request.  

---

## 📧 Contact  

For questions or collaboration, reach out at **kyra_ai_assistant@gmail.com** or open an issue.  

---

🚀 **Kyra – Making healthcare conversations more accessible!**
