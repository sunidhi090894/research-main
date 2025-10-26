import pandas as pd
import numpy as np
import torch
from transformers import pipeline, BertTokenizer, BertModel
from sklearn.decomposition import PCA
from sklearn.metrics import classification_report
from numpy.linalg import norm
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import RandomOverSampler

# Qiskit imports
from qiskit.circuit import QuantumCircuit, ParameterVector
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit_machine_learning.algorithms import QSVC

# -----------------------
# 1. Load Dataset
# -----------------------
print("🔹 Step 1: Loading dataset...")
df = pd.read_csv("transcripts.csv")[:1500]
print("✅ Dataset loaded!")
print("Columns:", df.columns.tolist())

# Detect text column
text_col = None
for col in df.columns:
    if "text" in col.lower() or "subtitle" in col.lower():
        text_col = col
if text_col is None:
    raise ValueError("❌ Could not find text column in CSV.")

texts = df[text_col].astype(str).tolist()
print(f"Total samples: {len(texts)}")

# -----------------------
# 2. Generate Pseudo-Labels (with confidence filter)
# -----------------------
print("\n🔹 Step 2: Generating pseudo-labels with DistilBERT...")
classifier = pipeline("text-classification",
                      model="j-hartmann/emotion-english-distilroberta-base",
                      top_k=1)

pseudo_labels = []
for i, txt in enumerate(texts):
    if i % 200 == 0:
        print(f"   Processing text {i}/{len(texts)} ...")
    result = classifier(txt[:512])[0][0]  # top prediction
    label = result["label"].lower()
    score = result["score"]
    # keep only confident labels, else neutral
    if score < 0.6:
        label = "neutral"
    pseudo_labels.append(label)

print("✅ Pseudo-labels generated!")
print("Label distribution:\n", pd.Series(pseudo_labels).value_counts())

# Convert labels to numeric
label_set = sorted(set(pseudo_labels))
label2id = {lab: i for i, lab in enumerate(label_set)}
y = np.array([label2id[lab] for lab in pseudo_labels])

# -----------------------
# 3. BERT Embeddings
# -----------------------
print("\n🔹 Step 3: Computing BERT embeddings...")
device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"📌 Using device: {device}")

tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
bert_model = BertModel.from_pretrained("bert-base-uncased").to(device)

embeddings = []
for i, txt in enumerate(texts):
    if i % 200 == 0:
        print(f"   Encoding text {i}/{len(texts)} ...")
    inputs = tokenizer(txt, return_tensors="pt", padding=True, truncation=True, max_length=128).to(device)
    with torch.no_grad():
        outputs = bert_model(**inputs)
    emb = outputs.last_hidden_state.mean(dim=1).cpu().numpy()
    embeddings.append(emb.flatten())

embeddings = np.array(embeddings)
print("✅ BERT embeddings created! Shape:", embeddings.shape)

# -----------------------
# 4. PCA Reduction
# -----------------------
print("\n🔹 Step 4: Reducing dimensions with PCA...")
pca = PCA(n_components=6)
reduced_embeddings = pca.fit_transform(embeddings)

X = reduced_embeddings / norm(reduced_embeddings, axis=1, keepdims=True)
print("✅ PCA completed! Shape:", X.shape)

# -----------------------
# 5. Train/Test Split + Oversampling
# -----------------------
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Balance the training data
ros = RandomOverSampler(random_state=42)
X_train_bal, y_train_bal = ros.fit_resample(X_train, y_train)
print("✅ After oversampling: label distribution\n", pd.Series(y_train_bal).value_counts())

# -----------------------
# 6. Quantum Feature Map
# -----------------------
def make_feature_map(num_features: int) -> QuantumCircuit:
    x = ParameterVector("x", num_features)
    qc = QuantumCircuit(num_features)
    for i in range(num_features):
        qc.ry(x[i], i)
    for i in range(num_features - 1):
        qc.cz(i, i + 1)
    return qc

feature_map = make_feature_map(X.shape[1])
quantum_kernel = FidelityQuantumKernel(feature_map=feature_map)

# -----------------------
# 7. Train QSVC
# -----------------------
print("\n🔹 Step 7: Training QSVC...")
qsvc = QSVC(quantum_kernel=quantum_kernel)
qsvc.fit(X_train_bal, y_train_bal)
print("✅ Training complete.")

# -----------------------
# 8. Evaluation
# -----------------------
print("\n🔹 Step 8: Evaluating model...")
y_pred = qsvc.predict(X_test)
print(classification_report(y_test, y_pred, target_names=label_set))