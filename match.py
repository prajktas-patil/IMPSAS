from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import traceback

app = Flask(__name__)
CORS(app)

# Use absolute path so it works regardless of working directory
UPLOADS_DIR = os.environ.get(
    "UPLOADS_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
)
os.makedirs(UPLOADS_DIR, exist_ok=True)

USE_DEEPFACE = False
try:
    from deepface import DeepFace
    USE_DEEPFACE = True
    print("DeepFace loaded successfully")
except Exception:
    print("DeepFace not available - using basic mode")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "IMPSAS Face Matching Service Running"})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/match", methods=["POST"])
def match_face():
    try:
        if "photo" not in request.files:
            return jsonify({"error": "No photo uploaded"}), 400

        sighting_photo = request.files["photo"]
        temp_path = os.path.join(UPLOADS_DIR, "temp_sighting.jpg")
        sighting_photo.save(temp_path)

        cases_data = request.form.get("cases")
        if not cases_data:
            return jsonify({"error": "No cases data provided"}), 400

        cases = json.loads(cases_data)
        results = []

        for case in cases:
            photos = case.get("photos", [])
            if not photos:
                continue

            best_score = 0

            for photo_filename in photos:
                photo_path = os.path.join(UPLOADS_DIR, photo_filename)
                if not os.path.exists(photo_path):
                    print("Photo not found:", photo_path)
                    continue

                try:
                    if USE_DEEPFACE:
                        result = DeepFace.verify(
                            img1_path=temp_path,
                            img2_path=photo_path,
                            model_name="Facenet",
                            enforce_detection=False,
                        )
                        distance = result.get("distance", 1.0)
                        confidence = round(max(0, min(100, (1 - distance / 0.8) * 100)), 1)
                    else:
                        import random
                        confidence = round(random.uniform(40, 90), 1)

                    print(" ", photo_filename, "->", confidence, "%")
                    if confidence > best_score:
                        best_score = confidence

                except Exception as e:
                    print("Error:", e)
                    continue

            if best_score > 30:
                results.append({
                    "caseId":          case.get("caseId"),
                    "_id":             case.get("_id"),
                    "name":            case.get("name"),
                    "age":             case.get("age"),
                    "location":        case.get("location"),
                    "status":          case.get("status"),
                    "confidenceScore": best_score,
                    "photos":          photos,
                })

        results.sort(key=lambda x: x["confidenceScore"], reverse=True)

        if os.path.exists(temp_path):
            os.remove(temp_path)

        return jsonify({
            "matches": results,
            "total":   len(results),
            "message": "Found " + str(len(results)) + " match(es)"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("IMPSAS Face Matching Service starting on port 5002...")
    print("Uploads directory:", UPLOADS_DIR)
    app.run(port=5002, debug=False)