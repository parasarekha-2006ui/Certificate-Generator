import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config

# Import blueprints
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.student_routes import student_bp
from routes.event_routes import event_bp
from routes.template_routes import template_bp
from routes.certificate_routes import certificate_bp
from routes.verify_routes import verify_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure required runtime folders exist
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.GENERATED_FOLDER, exist_ok=True)

    # Enable CORS specifically for frontend Vite origin
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                Config.FRONTEND_BASE_URL,
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # JWT Configuration
    jwt = JWTManager(app)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'The security token has expired. Please log in again.',
            'error': 'token_expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Invalid signature or token.',
            'error': 'invalid_token'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Authorization header with Bearer token is required.',
            'error': 'authorization_required'
        }), 401

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(template_bp)
    app.register_blueprint(certificate_bp)
    app.register_blueprint(verify_bp)

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'success': False, 'message': str(e.description if hasattr(e, 'description') else 'Bad request')}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Requested resource was not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'Internal server error occurred'}), 500

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'service': 'Online Certificate Generator API', 'version': '1.0.0'}), 200

    @app.route('/', methods=['GET'])
    def root_welcome():
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Online Certificate Generator - API</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
                .card {{ background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); text-align: center; max-width: 520px; border: 1px solid #e2e8f0; }}
                h1 {{ color: #1e3a8a; font-size: 1.5rem; margin-bottom: 0.5rem; }}
                p {{ color: #64748b; font-size: 0.95rem; line-height: 1.5; }}
                .btn {{ display: inline-block; background: #1e3a8a; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; margin-top: 1rem; transition: background 0.2s; }}
                .btn:hover {{ background: #1e40af; }}
                .links {{ margin-top: 1.5rem; font-size: 0.85rem; color: #94a3b8; }}
                .links a {{ color: #6366f1; text-decoration: none; margin: 0 0.5rem; }}
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Online Certificate Generator API</h1>
                <p>The Python Flask REST API is active on port 5000. Click below to open the interactive React dashboard:</p>
                <a href="{Config.FRONTEND_BASE_URL}" class="btn">Open React Dashboard ({Config.FRONTEND_BASE_URL}) &rarr;</a>
                <div class="links">
                    <a href="/api/health">API Health Check</a> •
                    <a href="{Config.FRONTEND_BASE_URL}/verify">Public Verification</a> •
                    <a href="{Config.FRONTEND_BASE_URL}/login">Admin Login</a>
                </div>
            </div>
        </body>
        </html>
        """

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"Starting Online Certificate Generator Backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
