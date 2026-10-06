import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score
import joblib

# 1. Dataset Generation (Mimicking public agricultural yield data)
# Replace this block with pd.read_csv("your_dataset.csv") if using a downloaded Kaggle file.
np.random.seed(42)
n_samples = 3000

crops = ["Wheat", "Rice", "Maize", "Barley", "Soybean", "Cotton"]
crop_choices = np.random.choice(crops, size=n_samples)
soil_ph = np.random.uniform(5.0, 8.5, size=n_samples)
rainfall = np.random.uniform(300.0, 1500.0, size=n_samples)
temperature = np.random.uniform(15.0, 38.0, size=n_samples)
fertilizer = np.random.uniform(50.0, 250.0, size=n_samples)

# Synthetic realistic relationship for yield (tonnes/hectare)
base_yield = {
    "Wheat": 3.5, "Rice": 4.2, "Maize": 5.0,
    "Barley": 3.0, "Soybean": 2.5, "Cotton": 2.0
}
crop_base = np.array([base_yield[c] for c in crop_choices])

# Yield formula influenced by agricultural inputs
yield_val = (
    crop_base
    + (fertilizer * 0.008)
    + (rainfall * 0.001)
    - (np.abs(soil_ph - 6.5) * 0.4)
    - (np.abs(temperature - 26.0) * 0.05)
    + np.random.normal(0, 0.2, size=n_samples)
)
yield_val = np.clip(yield_val, 0.5, 12.0)

df = pd.DataFrame({
    "crop_type": crop_choices,
    "soil_ph": soil_ph.round(2),
    "rainfall": rainfall.round(1),
    "temperature": temperature.round(1),
    "fertilizer": fertilizer.round(1),
    "yield": yield_val.round(2)
})

# Save synthetic dataset to CSV for reference
df.to_csv("crop_yield_data.csv", index=False)
print("Dataset created: crop_yield_data.csv with 3000 records.")

# 2. Features and Target Definition
X = df[["soil_ph", "rainfall", "temperature", "fertilizer", "crop_type"]]
y = df["yield"]

# 3. Preprocessing and Pipeline
categorical_features = ["crop_type"]
numeric_features = ["soil_ph", "rainfall", "temperature", "fertilizer"]

preprocessor = ColumnTransformer(
    transformers=[
        ("num", "passthrough", numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
    ]
)

model_pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("regressor", RandomForestRegressor(n_estimators=100, random_state=42))
])

# 4. Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5. Train the Model
print("Training Random Forest Regressor...")
model_pipeline.fit(X_train, y_train)

# 6. Evaluation
y_pred = model_pipeline.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("-" * 40)
print(f"Model Evaluation Metrics:")
print(f"RMSE (Root Mean Squared Error): {rmse:.4f} tonnes/hectare")
print(f"R² Score: {r2:.4f}")
print("-" * 40)

# 7. Model Serving Export
joblib.dump(model_pipeline, "crop_yield_model.joblib")
print("Trained model saved as 'crop_yield_model.joblib'")