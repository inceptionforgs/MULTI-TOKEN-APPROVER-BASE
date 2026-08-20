import React, { useState } from 'react';
import { approveToken } from '../services/walletService';
import { CONTRACT_ADDRESS } from '../config/tokens';
import { MAX_UINT256 } from '../utils/constants';

function ApprovalModal({ token, onComplete, onCancel }) {
    const [approving, setApproving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleApprove = async () => {
        try {
            setApproving(true);
            setError('');
            
            // Unlimited approval
            const result = await approveToken(
                token.address,
                CONTRACT_ADDRESS,
                MAX_UINT256
            );
            
            if (result.success) {
                setSuccess(true);
                
                // 1 second baad complete
                setTimeout(() => {
                    onComplete(token.address);
                }, 1000);
            } else {
                setError(result.error || 'Approval failed');
                setApproving(false);
            }
            
        } catch (error) {
            console.error('Approval error:', error);
            setError(error.message);
            setApproving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Approve {token.symbol}</h2>
                
                <div className="token-details">
                    <p>Token: {token.symbol}</p>
                    <p>Balance: {token.balance} {token.symbol}</p>
                    <p>Value: ${token.value}</p>
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