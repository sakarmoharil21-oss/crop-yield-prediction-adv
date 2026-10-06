# 🌱 Precision Crop Yield Prediction & Agronomic Advisory Platform
An end-to-end full-stack agricultural decision support platform. The system leverages a Machine Learning Random Forest regression pipeline to predict crop yield in tonnes per hectare (t/ha) from soil and environmental metrics, evaluates real-time agronomic advisory rules, tracks historical performance via MySQL, and visualizes farm health spatially using Leaflet.
---
## 📽️ Demo & Workflow Walkthrough




https://github.com/user-attachments/assets/f7b9de11-96c9-40ed-b91d-4a806cbcf395






> *The workflow demonstrates parameter submission, real-time yield evaluation, dynamic agronomic rule feedback, historical trend integration, and field plot status tracking.*
---
## 🚀 Key Features
* **Machine Learning Yield Prediction:** Predicts crop yields based on crop type, soil pH, precipitation, ambient temperature, and fertilizer levels.
* **Automated Agronomic Advisory:** Generates context-aware rule-based recommendations for soil pH adjustment, fertilizer management, and moisture control.
* **Historical Yield Tracking:** Persists every prediction session to a relational MySQL database and displays past runs using Recharts.
* **Spatial Farm Plot Visualization:** An interactive Leaflet map marking monitored field plots with dynamic status alerts (Optimal, Moderate Deficit, Low Yield Alert).
---
## 🛠️ Technology Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | React, Vite, Axios, Recharts, Leaflet, React-Leaflet, Lucide React |
| **Backend API** | FastAPI, Uvicorn, Pydantic, SQLAlchemy, PyMySQL |
| **Machine Learning** | Scikit-Learn (Random Forest Regressor, Pipeline), Joblib, Pandas, NumPy |
| **Database** | MySQL (Relational storage via `farm_db`) |

---
## 📋 System Prerequisites
* **Python:** 3.10+
* **Node.js:** 18+ & npm
* **MySQL Server:** 8.0+
---
## ⚙️ Installation & Local Setup
### 1. Clone the Repository
```bash
git clone [https://github.com/](https://github.com/)<your-username>/<repo-name>.git
cd <repo-name>

https://github.com/user-attachments/assets/19aad52a-887f-44e3-b2a0-156eeee9a1db



https://github.com/user-attachments/assets/b35ead8b-433c-4df5-a9ce-50bc1f524470

