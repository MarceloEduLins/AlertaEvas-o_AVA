import json
import sys
from collections import Counter

import numpy as np
import sklearn
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

FEATURES = [
    "avgAttendance",
    "avgGrade",
    "avgInactiveDays",
    "pendingActivities",
    "avgExamGrade",
    "avgProjectGrade",
]

FEATURE_LABELS = {
    "avgAttendance": "Presença",
    "avgGrade": "Média acadêmica",
    "avgInactiveDays": "Dias sem AVA",
    "pendingActivities": "Pendências",
    "avgExamGrade": "Provas",
    "avgProjectGrade": "Projetos",
}


def health():
    print(json.dumps({
        "ok": True,
        "python": sys.version.split()[0],
        "numpy": np.__version__,
        "scikitLearn": sklearn.__version__,
        "algorithm": "K-Means + PCA",
    }, ensure_ascii=False))


def profile_name(center):
    attendance, grade, inactive, pending, exam, project = center

    issues = []
    if attendance < 80:
        issues.append((100 - attendance, "Risco por frequência"))
    if inactive >= 8 or pending >= 5:
        issues.append((inactive + pending * 1.5, "Desengajamento no AVA"))
    if exam < 7 and exam + 0.6 < project:
        issues.append(((7 - exam) * 5, "Dificuldade em provas"))
    if project < 7 and project + 0.6 < exam:
        issues.append(((7 - project) * 5, "Dificuldade em projetos"))
    if grade < 7 and abs(exam - project) <= 0.6:
        issues.append(((7 - grade) * 5, "Dificuldade acadêmica geral"))

    if not issues:
        return "Perfil estável"
    return max(issues, key=lambda item: item[0])[1]


def profile_signals(center):
    attendance, grade, inactive, pending, exam, project = center
    signals = []
    if attendance < 80:
        signals.append(f"presença média {attendance:.1f}%")
    if inactive >= 8:
        signals.append(f"{inactive:.1f} dias médios sem AVA")
    if pending >= 4:
        signals.append(f"{pending:.1f} pendências médias")
    if exam < 7:
        signals.append(f"média em provas {exam:.1f}")
    if project < 7:
        signals.append(f"média em projetos {project:.1f}")
    if grade < 7:
        signals.append(f"média acadêmica {grade:.1f}")
    return signals[:4] or ["indicadores dentro da faixa esperada"]


def pca_projection(scaled, labels, rows):
    if len(rows) < 2:
        return [{"studentId": rows[0]["studentId"], "name": rows[0]["name"], "clusterId": int(labels[0]), "x": 0.0, "y": 0.0}] if rows else []

    # PCA não participa do agrupamento: serve apenas para projetar as seis
    # dimensões em duas coordenadas e permitir visualizar os clusters.
    n_components = 2 if scaled.shape[1] >= 2 else 1
    coords = PCA(n_components=n_components, random_state=42).fit_transform(scaled)
    if n_components == 1:
        coords = np.column_stack([coords[:, 0], np.zeros(len(rows))])

    return [
        {
            "studentId": row["studentId"],
            "name": row["name"],
            "clusterId": int(labels[index]),
            "x": round(float(coords[index, 0]), 4),
            "y": round(float(coords[index, 1]), 4),
        }
        for index, row in enumerate(rows)
    ]


def main():
    if "--health" in sys.argv:
        health()
        return

    rows = json.load(sys.stdin)
    if not rows:
        print(json.dumps({
            "clusters": [],
            "projection": [],
            "model": {"algorithm": "K-Means", "k": 0, "sampleSize": 0},
        }, ensure_ascii=False))
        return

    matrix = np.array([[float(row.get(feature, 0) or 0) for feature in FEATURES] for row in rows], dtype=float)
    unique_count = len(np.unique(matrix, axis=0))
    k = min(5, max(1, unique_count), len(rows))

    scaler = StandardScaler()
    scaled = scaler.fit_transform(matrix)

    if k == 1:
        labels = np.zeros(len(rows), dtype=int)
        centers_scaled = np.array([scaled.mean(axis=0)])
    else:
        model = KMeans(n_clusters=k, random_state=42, n_init=20)
        labels = model.fit_predict(scaled)
        centers_scaled = model.cluster_centers_

    centers_raw = scaler.inverse_transform(centers_scaled)
    silhouette = None
    if 1 < k < len(rows) and len(set(int(x) for x in labels)) > 1:
        silhouette = float(silhouette_score(scaled, labels))

    clusters = []
    used_names = Counter()
    for cluster_id in range(k):
        members = [rows[i] for i, label in enumerate(labels) if int(label) == cluster_id]
        center = centers_raw[cluster_id]
        base_name = profile_name(center)
        used_names[base_name] += 1
        name = base_name if used_names[base_name] == 1 else f"{base_name} {used_names[base_name]}"
        clusters.append({
            "id": int(cluster_id),
            "name": name,
            "size": len(members),
            "members": [{"studentId": m["studentId"], "name": m["name"]} for m in members],
            "center": {feature: round(float(center[i]), 2) for i, feature in enumerate(FEATURES)},
            "signals": profile_signals(center),
        })

    result = {
        "model": {
            "algorithm": "K-Means",
            "visualization": "PCA 2D",
            "k": k,
            "sampleSize": len(rows),
            "features": FEATURES,
            "featureLabels": FEATURE_LABELS,
            "silhouetteScore": None if silhouette is None else round(silhouette, 4),
            "randomState": 42,
            "nInit": 20,
            "referenceGrade": 7.0,
            "note": "Agrupamento exploratório não supervisionado. Os nomes dos perfis são interpretações dos centróides, não rótulos treinados. A projeção PCA é apenas visual.",
        },
        "projection": pca_projection(scaled, labels, rows),
        "clusters": sorted(clusters, key=lambda c: c["size"], reverse=True),
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
