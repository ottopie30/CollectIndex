---
description: How to train the model on Google Colab using a GPU
---

# Entraîner le Modèle sur Google Colab (GPU)

Ce guide explique comment utiliser la puissance gratuite de Google Colab pour entraîner votre modèle sur un dataset exporté.

## 1. Exporter les Données
Depuis votre terminal local :
```bash
npx tsx scripts/export-training-data.ts
```
Cela va créer un fichier `dataset.json` à la racine du projet.

## 2. Préparer Google Colab
1. Allez sur [Google Colab](https://colab.research.google.com/).
2. Créez un **Nouveau Notebook**.
3. Dans le menu "Exécution" > "Modifier le type d'exécution" > Sélectionnez **T4 GPU**.

## 3. Upload des Données
1. Cliquez sur l'icône de dossier 📁 à gauche.
2. Glissez-déposez votre fichier `dataset.json`.

## 4. Le Code d'Entraînement (Python)
Copiez-collez ce code dans une cellule et lancez-la (Maj + Entrée) :

```python
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional, BatchNormalization
from tensorflow.keras.callbacks import ReduceLROnPlateau, EarlyStopping

# 1. Charger les données
with open('dataset.json', 'r') as f:
    raw_data = json.load(f)

# 2. Normalisation
def normalize(data):
    min_val = np.min(data)
    max_val = np.max(data)
    return (data - min_val) / (max_val - min_val + 1e-10)

norm_prices = normalize(prices)
norm_volumes = normalize(volumes)

# 3. Création des séquences (Windowing)
WINDOW_SIZE = 30 # Must match App config
X = []
y = []

for i in range(len(norm_prices) - WINDOW_SIZE):
    # Features: [Price, Volume]
    features = np.column_stack((
        norm_prices[i:i+WINDOW_SIZE],
        norm_volumes[i:i+WINDOW_SIZE]
    ))
    
    future_price = norm_prices[i+WINDOW_SIZE]
    current_price = norm_prices[i+WINDOW_SIZE-1]
    label = 1 if future_price > current_price else 0
    
    X.append(features)
    y.append(label)

X = np.array(X)
y = np.array(y)

print(f"Dataset Shape: {X.shape}")

# 4. Modèle AVANCÉ (Deep Bidirectional LSTM)
model = Sequential([
    # Layer 1: Bidirectional LSTM pour capturer le passé et le futur du contexte
    Bidirectional(LSTM(128, return_sequences=True), input_shape=(WINDOW_SIZE, 2)),
    BatchNormalization(),
    Dropout(0.3),
    
    # Layer 2: Deep LSTM
    LSTM(64, return_sequences=False),
    BatchNormalization(),
    Dropout(0.3),
    
    # Layer 3: Dense layers
    Dense(32, activation='relu'),
    Dropout(0.1),
    Dense(1, activation='sigmoid')
])

optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
model.compile(optimizer=optimizer, loss='binary_crossentropy', metrics=['accuracy'])

# Callbacks pour optimiser l'entraînement
lr_scheduler = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, verbose=1)
early_stopping = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True)

# 5. Entraînement (Plus long, grâce au GPU)
history = model.fit(
    X, y, 
    epochs=100, 
    batch_size=64, 
    validation_split=0.2,
    callbacks=[lr_scheduler, early_stopping]
)

# 6. Sauvegarde pour TFJS
!pip install tensorflowjs
import tensorflowjs as tfjs

tfjs.converters.save_keras_model(model, 'tfjs_model')
print("Modèle converti !")

# Zipper pour télécharger
!zip -r model.zip tfjs_model
from google.colab import files
files.download('model.zip')
```

## 5. Importer le Modèle
1. Décompressez `model.zip`.
2. Déplacez les fichiers (`model.json` et `group1-shard1of1.bin`) dans votre projet :
   `public/models/rebond/`

Le site utilisera désormais votre modèle entraîné sur GPU !
