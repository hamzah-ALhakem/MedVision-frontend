import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/logo.png';
import Button from '../components/ui/Button';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const hasFetched = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!hasFetched.current) {
        hasFetched.current = true;
        try {
          await api.get(`/auth/verify-email/${token}`);
          setStatus('success');
        } catch (err) {
          setStatus('error');
        }
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 animate-in zoom-in duration-500">
        <img src={logo} alt="MedVision" className="w-20 h-20 mx-auto mb-6 object-contain" />
        
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 size={48} className="animate-spin text-primary" />
            <h2 className="text-xl font-bold text-dark">Verifying your email...</h2>
            <p className="text-gray-500">Please wait a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <CheckCircle size={56} className="text-green-500" />
            <h2 className="text-2xl font-bold text-dark">Email Verified Successfully!</h2>
            <p className="text-gray-500 mb-4">Your account is now fully active.</p>
            <Link to="/login" className="w-full block">
                <Button className="w-full py-3">Continue to Login</Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <XCircle size={56} className="text-red-500" />
            <h2 className="text-2xl font-bold text-dark">Verification Failed</h2>
            <p className="text-gray-500 mb-4">The link may be invalid or has expired.</p>
            <Link to="/signup" className="w-full block">
                <Button className="w-full py-3" variant="outline">Back to Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
