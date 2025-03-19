from datetime import datetime
from .user_profile import db

class PaymentMethod(db.Model):
    __tablename__ = 'payment_methods'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user_profiles.user_id'), nullable=False)
    payment_type = db.Column(db.String(50), nullable=False)
    provider = db.Column(db.String(100), nullable=False)
    account_number = db.Column(db.String(255), nullable=False)
    expiry_date = db.Column(db.String(10))
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        # Mask the account number for security
        masked_account = self.account_number
        if len(self.account_number) > 4:
            masked_account = '*' * (len(self.account_number) - 4) + self.account_number[-4:]
            
        return {
            'id': self.id,
            'user_id': self.user_id,
            'payment_type': self.payment_type,
            'provider': self.provider,
            'account_number': masked_account,
            'expiry_date': self.expiry_date,
            'is_default': self.is_default,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        } 