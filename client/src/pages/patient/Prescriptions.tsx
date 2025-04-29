import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  DocumentTextIcon, 
  PlusCircleIcon, 
  ArrowRightIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

// Interfaces
interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  profilePicture?: string;
}

interface Prescription {
  _id: string;
  doctor: Doctor;
  patient: { _id: string; name: string; };
  symptoms: string;
  diagnosis?: string;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }>;
  additionalNotes?: string;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  paymentStatus: 'pending' | 'completed';
  paymentAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionFormData {
  doctorId: string;
  symptoms: string;
}

const PrescriptionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  // State
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<PrescriptionFormData>({
    doctorId: '',
    symptoms: ''
  });
  
  // Payment state (mockup)
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
  });
  
  // Fetch prescriptions and doctors when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch prescriptions
        const prescriptionsRes = await axios.get('/api/prescriptions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch doctors for prescription request
        const doctorsRes = await axios.get('/api/doctors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPrescriptions(prescriptionsRes.data);
        setDoctors(doctorsRes.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);
  
  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle doctor selection
  const handleDoctorSelect = (doctorId: string) => {
    setFormData(prev => ({ ...prev, doctorId }));
  };
  
  // Handle payment input change
  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle prescription request form submission
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.doctorId || !formData.symptoms) {
      setError('Please select a doctor and describe your symptoms');
      return;
    }
    
    try {
      const res = await axios.post(
        '/api/prescriptions/request',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add new prescription to the list
      setPrescriptions(prev => [res.data, ...prev]);
      
      // Reset form and hide it
      setFormData({ doctorId: '', symptoms: '' });
      setShowRequestForm(false);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error requesting prescription');
    }
  };
  
  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPrescription) return;
    
    try {
      // Process payment (in a real app, this would involve a payment gateway)
      await axios.put(
        `/api/prescriptions/${selectedPrescription._id}/pay`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update prescription in state
      setPrescriptions(prev => 
        prev.map(p => 
          p._id === selectedPrescription._id
            ? { ...p, paymentStatus: 'completed' }
            : p
        )
      );
      
      // Reset payment form and hide it
      setPaymentInfo({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        nameOnCard: '',
      });
      setShowPaymentForm(false);
      setSelectedPrescription(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error processing payment');
    }
  };
  
  // Start payment process for a prescription
  const startPayment = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowPaymentForm(true);
  };
  
  // View prescription details
  const viewPrescription = (id: string) => {
    navigate(`/patient/prescriptions/${id}`);
  };
  
  // Get status badge based on prescription status
  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'pending') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 flex items-center">
          <BanknotesIcon className="h-3 w-3 mr-1" /> Payment Pending
        </span>
      );
    }
    
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" /> Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 flex items-center">
            <CheckCircleIcon className="h-3 w-3 mr-1" /> Accepted
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center">
            <CheckCircleIcon className="h-3 w-3 mr-1" /> Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center">
            <XCircleIcon className="h-3 w-3 mr-1" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-secondary-900 flex items-center">
          <DocumentTextIcon className="h-7 w-7 text-primary-600 mr-2" />
          Prescriptions
        </h1>
        
        <button
          onClick={() => setShowRequestForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusCircleIcon className="h-5 w-5 mr-1" />
          Request Prescription
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Prescription Request Form */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 overflow-auto bg-secondary-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary-900">
                Request Prescription
              </h2>
              <button
                onClick={() => setShowRequestForm(false)}
                className="text-secondary-500 hover:text-secondary-700"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleRequestSubmit}>
              <div className="mb-6">
                <h3 className="text-md font-medium text-secondary-700 mb-2">
                  Select a Doctor
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {doctors.map(doctor => (
                    <div 
                      key={doctor._id}
                      onClick={() => handleDoctorSelect(doctor._id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.doctorId === doctor._id 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-secondary-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <img 
                            className="h-12 w-12 rounded-full object-cover"
                            src={doctor.profilePicture || `https://ui-avatars.com/api/?name=${doctor.name}&background=0D8ABC&color=fff`}
                            alt={doctor.name} 
                          />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-secondary-900">Dr. {doctor.name}</h4>
                          <p className="text-sm text-secondary-500">{doctor.specialization}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {doctors.length === 0 && !loading && (
                  <p className="text-secondary-500 text-center py-4">No doctors found</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="symptoms" className="label">
                  Describe Your Symptoms
                </label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  rows={5}
                  className="input"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  required
                  placeholder="Please describe your symptoms in detail..."
                />
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.doctorId}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Payment Form */}
      {showPaymentForm && selectedPrescription && (
        <div className="fixed inset-0 z-50 overflow-auto bg-secondary-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary-900">
                Complete Payment
              </h2>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-secondary-500 hover:text-secondary-700"
              >
                &times;
              </button>
            </div>
            
            <div className="bg-secondary-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-secondary-700">Prescription Request:</span>
                <span className="font-medium">#{selectedPrescription._id.slice(-6)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-secondary-700">Doctor:</span>
                <span className="font-medium">Dr. {selectedPrescription.doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-700">Amount:</span>
                <span className="font-medium text-primary-600">₹{selectedPrescription.paymentAmount}</span>
              </div>
            </div>
            
            <form onSubmit={handlePaymentSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="nameOnCard" className="label">
                    Name on card
                  </label>
                  <input
                    type="text"
                    id="nameOnCard"
                    name="nameOnCard"
                    className="input"
                    required
                    value={paymentInfo.nameOnCard}
                    onChange={handlePaymentInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="cardNumber" className="label">
                    Card number (for demo, any 16 digits)
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    className="input"
                    required
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={paymentInfo.cardNumber}
                    onChange={handlePaymentInputChange}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiryDate" className="label">
                      Expiry date
                    </label>
                    <input
                      type="text"
                      id="expiryDate"
                      name="expiryDate"
                      className="input"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={paymentInfo.expiryDate}
                      onChange={handlePaymentInputChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cvv" className="label">
                      CVV
                    </label>
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      className="input"
                      required
                      placeholder="123"
                      maxLength={3}
                      value={paymentInfo.cvv}
                      onChange={handlePaymentInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="btn-primary w-full py-2"
                >
                  Pay ₹{selectedPrescription.paymentAmount}
                </button>
                
                <p className="text-xs text-secondary-500 text-center mt-2">
                  This is a demo payment. No actual charges will be made.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Prescriptions List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-8 bg-secondary-50 rounded-lg">
          <DocumentTextIcon className="h-12 w-12 text-secondary-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No prescriptions yet</h3>
          <p className="text-secondary-600 mb-4">
            Request a prescription from a doctor when you need medical advice.
          </p>
          <button
            onClick={() => setShowRequestForm(true)}
            className="btn-primary"
          >
            Request Now
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-secondary-200">
          <ul className="divide-y divide-secondary-200">
            {prescriptions.map(prescription => (
              <li key={prescription._id} className="p-4 hover:bg-secondary-50 transition-colors">
                <div className="flex items-start justify-between flex-wrap md:flex-nowrap">
                  <div className="mb-2 md:mb-0 md:pr-4">
                    <div className="flex items-center">
                      <div className="font-medium text-secondary-900 mb-1">
                        Dr. {prescription.doctor.name} - {prescription.doctor.specialization}
                      </div>
                      <div className="ml-3">
                        {getStatusBadge(prescription.status, prescription.paymentStatus)}
                      </div>
                    </div>
                    <p className="text-sm text-secondary-600 mb-1">
                      Requested on: {formatDate(prescription.createdAt)}
                    </p>
                    <p className="text-sm text-secondary-700 line-clamp-2">
                      {prescription.symptoms.substring(0, 150)}
                      {prescription.symptoms.length > 150 ? '...' : ''}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-auto">
                    {prescription.paymentStatus === 'pending' && (
                      <button
                        onClick={() => startPayment(prescription)}
                        className="btn-primary text-sm"
                      >
                        Pay ₹{prescription.paymentAmount}
                      </button>
                    )}
                    
                    {prescription.status === 'completed' && (
                      <button
                        onClick={() => viewPrescription(prescription._id)}
                        className="btn-secondary text-sm flex items-center"
                      >
                        View Prescription
                        <ArrowRightIcon className="h-4 w-4 ml-1" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsPage; 