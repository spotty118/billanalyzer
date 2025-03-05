from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Configure application - load from environment variables or config file
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///billanalyzer.db') # Use SQLite for simplicity, can be changed to other DBs
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Disable modification tracking

    db.init_app(app) # Initialize SQLAlchemy with the app

    # Import and register blueprints for routes
    from .routes import bill_routes
    app.register_blueprint(bill_routes.bp)

    return app