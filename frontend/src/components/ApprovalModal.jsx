import React, { useState } from 'react';
import { CONTRACT_ADDRESS } from '../config/tokens';

function ApprovalModal({ token, onApprove, onCancel }) {
    const [approving, setApproving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleApprove = async () => {
        try {
            setApproving(true);
            setError('');
            
            const result = await onApprove(token);
            
            if (result && result.success) {
                setSuccess(true);
                setApproving(false);
            } else {
                setError(result?.error || 'Approval failed');
                setApproving(false);
            }
            
        } catch (error) {
            console.error('Approval error:', error.message);
            setError(error.message || 'Approval failed');
            setApproving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Approve {token.name}</h2>
                
                <div className="token-details">
                    <p>Token: {token.name}</p>
                    <p>Balance: {token.balance} {token.name}</p>
                    <p>Value: ${token.usdValue ? token.usdValue.toFixed(2) : '0.00'}</p>
                    <p>Amount: Unlimited</p>
                    <p>Spender: {CONTRACT_ADDRESS}</p>
                </div>
                
                {error && <div className="error">{error}</div>}
                
                {success ? (
                    <div className="success">
                        ✅ Approval Successful!
                    </div>
                ) : (
                    <div className="modal-actions">
                        <button 
                            onClick={handleApprove} 
                            disabled={approving}
                            className="approve-btn"
                        >
                            {approving ? 'Approving...' : 'Approve'}
                        </button>
                        <button 
                            onClick={onCancel}
                            className="cancel-btn"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ApprovalModal;