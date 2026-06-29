from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import json
import os
import bcrypt
import jwt
import datetime
import time
import urllib.request
import urllib.parse
from urllib.error import HTTPError

# Load .env file manually if exists
env_path = os.path.join(os.path.dirname(__file__), '../.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                parts = line.strip().split('=', 1)
                if len(parts) == 2:
                    key, val = parts
                    os.environ[key.strip()] = val.strip()

app = Flask(__name__)
CORS(app)

@app.route('/api/tmdb/<path:subpath>', methods=['GET'])
def tmdb_proxy(subpath):
    try:
        query_params = dict(request.args)
        query_params["api_key"] = os.environ["TMDB_API_KEY"]
        encoded_query = urllib.parse.urlencode(query_params)
        url = f"https://api.themoviedb.org/3/{subpath}?{encoded_query}"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return jsonify(data), response.status
    except HTTPError as e:
        try:
            error_data = json.loads(e.read().decode('utf-8'))
            return jsonify(error_data), e.code
        except:
            return jsonify({"message": e.reason}), e.code
    except Exception as e:
        print("TMDB Proxy Error:", e)
        return jsonify({"message": "Error fetching data from TMDB"}), 500

DB_FILE = os.path.join(os.path.dirname(__file__), 'db.json')
SECRET_KEY = "SECRET_KEY"

def read_db():
    if not os.path.exists(DB_FILE):
        return {"users": []}
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"users": []}

def write_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# JWT Auth Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"message": "No token"}), 401
        
        try:
            # Expect: Bearer TOKEN
            parts = auth_header.split(" ")
            if len(parts) != 2 or parts[0] != "Bearer":
                return jsonify({"message": "Invalid token format"}), 401
            
            token = parts[1]
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user_id = decoded.get("id")
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired"}), 401
        except Exception as e:
            return jsonify({"message": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated

/* ==========================
   SIGNUP
========================== */
@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.json or {}
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({"message": "Missing fields"}), 400
            
        db = read_db()
        existing_user = next((u for u in db['users'] if u['email'] == email), None)
        
        if existing_user:
            return jsonify({"message": "User already exists"})
            
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')
        
        new_user = {
            "_id": str(int(time.time() * 1000)),
            "username": username,
            "email": email,
            "password": hashed_password,
            "watchlist": []
        }
        
        db['users'].append(new_user)
        write_db(db)
        
        payload = {
            "id": new_user["_id"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            "message": "User created successfully",
            "token": token,
            "username": new_user["username"]
        })
    except Exception as e:
        print("SIGNUP ERROR:", e)
        return jsonify({"message": "Server error"}), 500

/* ==========================
   LOGIN
========================== */
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json or {}
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"message": "Missing fields"}), 400
            
        db = read_db()
        user = next((u for u in db['users'] if u['email'] == email), None)
        
        if not user:
            return jsonify({"message": "User not found"})
            
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({"message": "Wrong password"})
            
        payload = {
            "id": user["_id"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            "token": token,
            "username": user["username"]
        })
    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"message": "Server error"}), 500

/* ==========================
   ADD TO WATCHLIST
========================== */
@app.route('/watchlist', methods=['POST'])
@token_required
def add_watchlist():
    try:
        data = request.json or {}
        movie_id = data.get('movieId')
        title = data.get('title')
        poster = data.get('poster')
        
        if not movie_id:
            return jsonify({"message": "Movie ID required"}), 400
            
        db = read_db()
        user = next((u for u in db['users'] if u['_id'] == request.user_id), None)
        
        if not user:
            return jsonify({"message": "User not found"}), 404
            
        exists = next((m for m in user.get('watchlist', []) if m['movieId'] == movie_id), None)
        if exists:
            return jsonify({"message": "Already in watchlist"})
            
        user.setdefault('watchlist', []).append({
            "movieId": movie_id,
            "title": title,
            "poster": poster
        })
        
        write_db(db)
        return jsonify({"message": "Added to watchlist"})
    except Exception as e:
        print("ADD WATCHLIST ERROR:", e)
        return jsonify({"message": str(e)}), 500

/* ==========================
   GET WATCHLIST
========================== */
@app.route('/watchlist', methods=['GET'])
@token_required
def get_watchlist():
    try:
        db = read_db()
        user = next((u for u in db['users'] if u['_id'] == request.user_id), None)
        
        if not user:
            return jsonify({"message": "User not found"}), 404
            
        return jsonify(user.get('watchlist', []))
    except Exception as e:
        print("GET WATCHLIST ERROR:", e)
        return jsonify({"message": "Failed to fetch watchlist"}), 500

/* ==========================
   DELETE WATCHLIST MOVIE
========================== */
@app.route('/watchlist/<int:movie_id>', methods=['DELETE'])
@token_required
def delete_watchlist(movie_id):
    try:
        db = read_db()
        user = next((u for u in db['users'] if u['_id'] == request.user_id), None)
        
        if not user:
            return jsonify({"message": "User not found"}), 404
            
        user['watchlist'] = [m for m in user.get('watchlist', []) if m['movieId'] != movie_id]
        
        write_db(db)
        return jsonify({"message": "Movie removed"})
    except Exception as e:
        print("DELETE WATCHLIST ERROR:", e)
        return jsonify({"message": "Failed to remove movie"}), 500

# ==========================
#    GET REVIEWS
# ==========================
@app.route('/movies/<movie_id>/reviews', methods=['GET'])
def get_reviews(movie_id):
    try:
        db = read_db()
        reviews = db.get('reviews', [])
        movie_reviews = [r for r in reviews if r.get('movieId') == movie_id]
        
        safe_reviews = []
        for r in movie_reviews:
            safe_review = r.copy()
            safe_review['likes'] = r.get('likes', [])
            safe_review['dislikes'] = r.get('dislikes', [])
            safe_review['replies'] = r.get('replies', [])
            safe_reviews.append(safe_review)
            
        return jsonify(safe_reviews)
    except Exception as e:
        print("GET REVIEWS ERROR:", e)
        return jsonify({"message": "Failed to fetch reviews"}), 500

# ==========================
#    POST REVIEW
# ==========================
@app.route('/movies/<movie_id>/reviews', methods=['POST'])
@token_required
def post_review(movie_id):
    try:
        data = request.json or {}
        review_text = data.get('reviewText')
        if not review_text:
            return jsonify({"message": "Review text is required"}), 400
            
        db = read_db()
        user = next((u for u in db['users'] if u['_id'] == request.user_id), None)
        if not user:
            return jsonify({"message": "User not found"}), 404
            
        new_review = {
            "id": str(int(time.time() * 1000)),
            "movieId": movie_id,
            "username": user['username'],
            "reviewText": review_text,
            "createdAt": datetime.datetime.utcnow().isoformat() + "Z",
            "likes": [],
            "dislikes": [],
            "replies": []
        }
        
        db.setdefault('reviews', []).append(new_review)
        write_db(db)
        
        return jsonify({"message": "Review posted successfully", "review": new_review})
    except Exception as e:
        print("POST REVIEW ERROR:", e)
        return jsonify({"message": "Failed to post review"}), 500

# ==========================
#    CINERATE RATINGS
# ==========================
@app.route('/movies/<movie_id>/rate', methods=['GET'])
def get_movie_rating(movie_id):
    try:
        db = read_db()
        ratings = db.get('ratings', [])
        movie_ratings = [r for r in ratings if r.get('movieId') == movie_id]
        
        total = sum(int(r.get('rating', 0)) for r in movie_ratings)
        average_rating = round(total / len(movie_ratings), 1) if movie_ratings else 0.0
        
        user_rating = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
                decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                u_id = decoded.get("id")
                u_rating = next((r for r in movie_ratings if r.get('userId') == u_id), None)
                if u_rating:
                    user_rating = u_rating.get('rating')
            except:
                pass
                
        return jsonify({
            "averageRating": average_rating,
            "totalRatings": len(movie_ratings),
            "userRating": user_rating
        })
    except Exception as e:
        print("GET RATINGS ERROR:", e)
        return jsonify({"message": "Failed to fetch ratings"}), 500

@app.route('/movies/<movie_id>/rate', methods=['POST'])
@token_required
def rate_movie(movie_id):
    try:
        data = request.json or {}
        rating_val = data.get('rating')
        try:
            rating_val = int(rating_val)
        except:
            return jsonify({"message": "Rating must be between 1 and 10"}), 400
            
        if rating_val < 1 or rating_val > 10:
            return jsonify({"message": "Rating must be between 1 and 10"}), 400
            
        db = read_db()
        ratings = db.setdefault('ratings', [])
        
        user_rating = next((r for r in ratings if r.get('movieId') == movie_id and r.get('userId') == request.user_id), None)
        if user_rating:
            return jsonify({"message": "You have already rated this movie"}), 400
            
        ratings.append({
            "movieId": movie_id,
            "userId": request.user_id,
            "rating": rating_val
        })
            
        write_db(db)
        return jsonify({"message": "Rating submitted successfully"})
    except Exception as e:
        print("RATE MOVIE ERROR:", e)
        return jsonify({"message": "Failed to submit rating"}), 500

# ==========================
#    REVIEW INTERACTIONS
# ==========================
@app.route('/reviews/<review_id>/like', methods=['POST'])
@token_required
def like_review(review_id):
    try:
        db = read_db()
        reviews = db.get('reviews', [])
        review = next((r for r in reviews if r.get('id') == review_id), None)
        if not review:
            return jsonify({"message": "Review not found"}), 404
            
        likes = review.setdefault('likes', [])
        dislikes = review.setdefault('dislikes', [])
        
        if request.user_id in likes:
            likes.remove(request.user_id)
        else:
            likes.append(request.user_id)
            if request.user_id in dislikes:
                dislikes.remove(request.user_id)
                
        write_db(db)
        return jsonify({"message": "Like updated successfully", "likes": likes, "dislikes": dislikes})
    except Exception as e:
        print("LIKE REVIEW ERROR:", e)
        return jsonify({"message": "Failed to update like"}), 500

@app.route('/reviews/<review_id>/dislike', methods=['POST'])
@token_required
def dislike_review(review_id):
    try:
        db = read_db()
        reviews = db.get('reviews', [])
        review = next((r for r in reviews if r.get('id') == review_id), None)
        if not review:
            return jsonify({"message": "Review not found"}), 404
            
        likes = review.setdefault('likes', [])
        dislikes = review.setdefault('dislikes', [])
        
        if request.user_id in dislikes:
            dislikes.remove(request.user_id)
        else:
            dislikes.append(request.user_id)
            if request.user_id in likes:
                likes.remove(request.user_id)
                
        write_db(db)
        return jsonify({"message": "Dislike updated successfully", "likes": likes, "dislikes": dislikes})
    except Exception as e:
        print("DISLIKE REVIEW ERROR:", e)
        return jsonify({"message": "Failed to update dislike"}), 500

@app.route('/reviews/<review_id>/reply', methods=['POST'])
@token_required
def reply_review(review_id):
    try:
        data = request.json or {}
        reply_text = data.get('replyText')
        if not reply_text:
            return jsonify({"message": "Reply text is required"}), 400
            
        db = read_db()
        reviews = db.get('reviews', [])
        review = next((r for r in reviews if r.get('id') == review_id), None)
        if not review:
            return jsonify({"message": "Review not found"}), 404
            
        user = next((u for u in db['users'] if u['_id'] == request.user_id), None)
        if not user:
            return jsonify({"message": "User not found"}), 404
            
        replies = review.setdefault('replies', [])
        new_reply = {
            "id": str(int(time.time() * 1000)),
            "username": user['username'],
            "replyText": reply_text,
            "createdAt": datetime.datetime.utcnow().isoformat() + "Z"
        }
        replies.append(new_reply)
        write_db(db)
        
        return jsonify({"message": "Reply posted successfully", "reply": new_reply})
    except Exception as e:
        print("REPLY REVIEW ERROR:", e)
        return jsonify({"message": "Failed to post reply"}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
