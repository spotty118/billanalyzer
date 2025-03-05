# billanalyzer/models/models.py
# Assuming your original models.py had SQLAlchemy model definitions, move them here.
# Example (replace with your actual models):
from billanalyzer import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return '<User %r>' % self.username