import os
from datetime import datetime
import joblib
import pandas as pd
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import urllib.parse
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime              
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# 1. Fill your actual password here
MYSQL_USER = "root"
RAW_PASSWORD = os.getenv("MYSQL_PASSWORD","overload@157")  # Replace with exact password
MYSQL_PASSWORD = urllib.parse.quote_plus(RAW_PASSWORD)
MYSQL_HOST = "127.0.0.1"
MYSQL_PORT = "3306"
MYSQL_DB = "farm_db"

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Model (Defines the 'predictions' table in MySQL)
class PredictionRecord(Base):
  __tablename__ = "predictions"

  id = Column(Integer, primary_key=True, index=True)
  created_at = Column(DateTime, default=datetime.utcnow)
  crop_type = Column(String(50))
  soil_ph = Column(Float)
  rainfall = Column(Float)
  temperature = Column(Float)
  fertilizer = Column(Float)
  target_yield = Column(Float)
  predicted_yield = Column(Float)


# Auto-create the table inside farm_db if it does not exist
Base.metadata.create_all(bind=engine)


def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()


# ==========================================
# 2. FASTAPI APPLICATION SETUP
# ==========================================
app = FastAPI(
    title="Crop Yield Prediction & Advisory API",
    description="API to predict crop yields and store records in MySQL.",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained ML model
MODEL_PATH = "crop_yield_model.joblib"
if not os.path.exists(MODEL_PATH):
  raise FileNotFoundError(f"Model file {MODEL_PATH} not found. Run train.py first.")

model = joblib.load(MODEL_PATH)


class FarmDataInput(BaseModel):
  crop_type: str = Field(..., example="Wheat")
  soil_ph: float = Field(..., ge=0.0, le=14.0, example=6.5)
  rainfall: float = Field(..., ge=0.0, example=850.0)
  temperature: float = Field(..., example=24.5)
  fertilizer: float = Field(..., ge=0.0, example=120.0)
  target_yield: float = Field(default=0.0, ge=0.0, example=4.0)


def generate_advisory(
    crop: str,
    ph: float,
    rain: float,
    temp: float,
    fert: float,
    predicted_yield: float,
    target_yield: float,
):
  advice = []
  alert = None

  if ph < 6.0:
    advice.append(
        "Soil is slightly acidic. Consider applying agricultural lime to"
        " balance pH."
    )
  elif ph > 7.5:
    advice.append(
        "Soil is alkaline. Adding organic compost or sulfur can help neutralize"
        " pH levels."
    )
  else:
    advice.append("Soil pH is in the optimal range (6.0 - 7.5).")

  if rain < 500:
    advice.append(
        "Recorded rainfall is low. Supplementary drip or sprinkler irrigation"
        " is recommended."
    )
  elif rain > 1200:
    advice.append(
        "Heavy rainfall observed. Ensure proper drainage channels to prevent"
        " waterlogging."
    )
  else:
    advice.append("Moisture levels appear adequate for typical growth cycles.")

  if fert < 80:
    advice.append(
        "Fertilizer dosage is on the lower side. Consider a soil test to verify"
        " nitrogen/phosphorus levels."
    )
  elif fert > 200:
    advice.append(
        "High fertilizer application detected. Monitor runoff to prevent"
        " nutrient burn."
    )
  else:
    advice.append("Fertilizer application rate is well-balanced.")

  if target_yield > 0 and predicted_yield < target_yield:
    deficit = round(target_yield - predicted_yield, 2)
    alert = (
        f"Warning: Predicted yield ({predicted_yield} t/ha) is {deficit} t/ha"
        f" below your target of {target_yield} t/ha."
    )

  return advice, alert


@app.get("/")
def read_root():
  return {"status": "online", "message": "Crop Yield API connected to MySQL"}


@app.post("/predict")
def predict_yield(data: FarmDataInput, db: Session = Depends(get_db)):
  try:
    input_df = pd.DataFrame([{
        "soil_ph": data.soil_ph,
        "rainfall": data.rainfall,
        "temperature": data.temperature,
        "fertilizer": data.fertilizer,
        "crop_type": data.crop_type,
    }])

    # 1. Run ML inference
    prediction = model.predict(input_df)[0]
    predicted_yield = round(float(prediction), 2)

    # 2. Rule-based advisory
    recommendations, alert_message = generate_advisory(
        crop=data.crop_type,
        ph=data.soil_ph,
        rain=data.rainfall,
        temp=data.temperature,
        fert=data.fertilizer,
        predicted_yield=predicted_yield,
        target_yield=data.target_yield,
    )

    # 3. Save into MySQL table
    db_record = PredictionRecord(
        crop_type=data.crop_type,
        soil_ph=data.soil_ph,
        rainfall=data.rainfall,
        temperature=data.temperature,
        fertilizer=data.fertilizer,
        target_yield=data.target_yield,
        predicted_yield=predicted_yield,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    return {
        "id": db_record.id,
        "crop_type": data.crop_type,
        "predicted_yield_tonnes_per_hectare": predicted_yield,
        "target_yield": data.target_yield,
        "alert": alert_message,
        "recommendations": recommendations,
    }
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/history")
def get_prediction_history(db: Session = Depends(get_db)):
  """Returns past prediction records saved in MySQL for charts/trends."""
  records = (
      db.query(PredictionRecord)
      .order_by(PredictionRecord.created_at.desc())
      .limit(15)
      .all()
  )
  return records