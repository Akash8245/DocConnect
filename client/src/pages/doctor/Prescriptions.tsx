import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  DocumentTextIcon, 
  CheckIcon, 
  XMarkIcon, 
  PencilSquareIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

// Interfaces
interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface Patient {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface Prescription {
  _id: string;
  doctor: { _id: string; name: string; };
  patient: Patient;
  symptoms: string;
  diagnosis?: string;
  medications?: Medication[];
  additionalNotes?: string;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  paymentStatus: 'pending' | 'completed';
  paymentAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionFormData {
  diagnosis: string;
  additionalNotes: string;
  medications: Medication[];
}

const emptyMedication: Medication = {
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  notes: ''
};

const DoctorPrescriptionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  // State
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<PrescriptionFormData>({
    diagnosis: '',
    additionalNotes: '',
    medications: [{ ...emptyMedication }]
  });
  
  // Fetch prescriptions when component mounts
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        
        const res = await axios.get('/api/prescriptions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPrescriptions(res.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching prescriptions');
        setLoading(false);
      }
    };
    
    fetchPrescriptions();
  }, [token]);
  
  // Filter prescriptions based on active tab
  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (activeTab === 'pending') {
      return prescription.status === 'pending';
    } else if (activeTab === 'accepted') {
      return prescription.status === 'accepted' || (prescription.status === 'pending' && prescription.paymentStatus === 'completed');
    } else if (activeTab === 'completed') {
      return prescription.status === 'completed';
    } else if (activeTab === 'rejected') {
      return prescription.status === 'rejected';
    }
    return true;
  });
  
  // Handle accepting a prescription request
  const handleAccept = async (prescriptionId: string) => {
    try {
      const res = await axios.put(
        `/api/prescriptions/${prescriptionId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update prescription in state
      setPrescriptions(prev => 
        prev.map(p => 
          p._id === prescriptionId ? { ...p, status: 'accepted' } : p
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error accepting prescription');
    }
  };
  
  // Handle rejecting a prescription request
  const handleReject = async (prescriptionId: string) => {
    if (!window.confirm('Are you sure you want to reject this prescription request?')) {
      return;
    }
    
    try {
      const res = await axios.put(
        `/api/prescriptions/${prescriptionId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update prescription in state
      setPrescriptions(prev => 
        prev.map(p => 
          p._id === prescriptionId ? { ...p, status: 'rejected' } : p
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error rejecting prescription');
    }
  };
  
  // Open prescription form to complete it
  const openPrescriptionForm = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setFormData({
      diagnosis: prescription.diagnosis || '',
      additionalNotes: prescription.additionalNotes || '',
      medications: prescription.medications && prescription.medications.length > 0 
        ? [...prescription.medications] 
        : [{ ...emptyMedication }]
    });
    setShowPrescriptionForm(true);
  };
  
  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle medication input change
  const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
    setFormData(prev => {
      const updatedMedications = [...prev.medications];
      updatedMedications[index] = {
        ...updatedMedications[index],
        [field]: value
      };
      return { ...prev, medications: updatedMedications };
    });
  };
  
  // Add new medication field
  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { ...emptyMedication }]
    }));
  };
  
  // Remove medication field
  const removeMedication = (index: number) => {
    if (formData.medications.length === 1) {
      return; // Keep at least one medication field
    }
    
    setFormData(prev => {
      const updatedMedications = [...prev.medications];
      updatedMedications.splice(index, 1);
      return { ...prev, medications: updatedMedications };
    });
  };
  
  // Handle prescription form submission
  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPrescription) return;
    
    // Validate form
    if (!formData.diagnosis) {
      setError('Diagnosis is required');
      return;
    }
    
    const validMedications = formData.medications.filter(med => 
      med.name && med.dosage && med.frequency && med.duration
    );
    
    if (validMedications.length === 0) {
      setError('At least one complete medication is required');
      return;
    }
    
    try {
      const res = await axios.put(
        `/api/prescriptions/${selectedPrescription._id}`,
        {
          diagnosis: formData.diagnosis,
          medications: validMedications,
          additionalNotes: formData.additionalNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update prescription in state
      setPrescriptions(prev => 
        prev.map(p => 
          p._id === selectedPrescription._id ? res.data : p
        )
      );
      
      // Reset form and hide it
      setShowPrescriptionForm(false);
      setSelectedPrescription(null);
      setFormData({
        diagnosis: '',
        additionalNotes: '',
        medications: [{ ...emptyMedication }]
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error completing prescription');
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
  
  // Get status badge for prescription
  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'pending' && status !== 'rejected') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 flex items-center">
          <BanknotesIcon className="h-3 w-3 mr-1" /> Awaiting Payment
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-secondary-900 flex items-center mb-6">
        <DocumentTextIcon className="h-7 w-7 text-primary-600 mr-2" />
        Prescription Requests
      </h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-secondary-200">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'accepted'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Ready to Write
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rejected'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Rejected
            </button>
          </nav>
        </div>
      </div>
      
      {/* Prescription Form Modal */}
      {showPrescriptionForm && selectedPrescription && (
        <div className="fixed inset-0 z-50 overflow-auto bg-secondary-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary-900">
                Complete Prescription
              </h2>
              <button
                onClick={() => setShowPrescriptionForm(false)}
                className="text-secondary-500 hover:text-secondary-700"
              >
                &times;
              </button>
            </div>
            
            <div className="bg-secondary-50 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <UserCircleIcon className="h-5 w-5 text-secondary-500" />
                <span className="font-medium">{selectedPrescription.patient.name}</span>
              </div>
              <h3 className="text-sm font-medium text-secondary-500 mb-1">Symptoms</h3>
              <p className="text-secondary-900 whitespace-pre-line">{selectedPrescription.symptoms}</p>
            </div>
            
            <form onSubmit={handleSubmitPrescription}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="diagnosis" className="label">Diagnosis</label>
                  <textarea
                    id="diagnosis"
                    name="diagnosis"
                    rows={3}
                    className="input"
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your diagnosis based on the patient's symptoms"
                  />
                </div>
                
                <div>
                  <label className="label">Medications</label>
                  {formData.medications.map((medication, index) => (
                    <div key={index} className="p-4 bg-secondary-50 rounded-lg mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Medication #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={formData.medications.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Medication Name
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={medication.name}
                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                            required
                            placeholder="e.g., Paracetamol"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Dosage
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={medication.dosage}
                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                            required
                            placeholder="e.g., 500mg"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Frequency
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={medication.frequency}
                            onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                            required
                            placeholder="e.g., Twice daily"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={medication.duration}
                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                            required
                            placeholder="e.g., 7 days"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Notes (Optional)
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={medication.notes || ''}
                          onChange={(e) => handleMedicationChange(index, 'notes', e.target.value)}
                          placeholder="e.g., Take after meals"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addMedication}
                    className="btn-secondary w-full"
                  >
                    + Add Another Medication
                  </button>
                </div>
                
                <div>
                  <label htmlFor="additionalNotes" className="label">
                    Additional Instructions (Optional)
                  </label>
                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    rows={3}
                    className="input"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    placeholder="Any additional instructions or recommendations for the patient"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Complete Prescription
                </button>
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
      ) : filteredPrescriptions.length === 0 ? (
        <div className="text-center py-8 bg-secondary-50 rounded-lg">
          <DocumentTextIcon className="h-12 w-12 text-secondary-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No {activeTab} prescriptions</h3>
          <p className="text-secondary-600">
            {activeTab === 'pending' && 'You have no pending prescription requests.'}
            {activeTab === 'accepted' && 'You have no prescriptions ready to write.'}
            {activeTab === 'completed' && 'You have not completed any prescriptions yet.'}
            {activeTab === 'rejected' && 'You have not rejected any prescriptions.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-secondary-200">
          <ul className="divide-y divide-secondary-200">
            {filteredPrescriptions.map(prescription => (
              <li key={prescription._id} className="p-4 hover:bg-secondary-50 transition-colors">
                <div className="flex items-start justify-between flex-wrap md:flex-nowrap">
                  <div className="mb-3 md:mb-0 md:pr-4">
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-secondary-900">
                        {prescription.patient.name}
                      </span>
                      <span className="ml-3">
                        {getStatusBadge(prescription.status, prescription.paymentStatus)}
                      </span>
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
                    {prescription.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAccept(prescription._id)}
                          className="btn-secondary text-sm px-3 py-1 flex items-center"
                          title="Accept Request"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Accept
                        </button>
                        
                        <button
                          onClick={() => handleReject(prescription._id)}
                          className="text-sm px-3 py-1 border border-red-300 text-red-700 rounded-md hover:bg-red-50 flex items-center"
                          title="Reject Request"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    
                    {prescription.status === 'accepted' && prescription.paymentStatus === 'completed' && (
                      <button
                        onClick={() => openPrescriptionForm(prescription)}
                        className="btn-primary text-sm px-3 py-1 flex items-center"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                        Write Prescription
                      </button>
                    )}
                    
                    {prescription.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/doctor/prescriptions/${prescription._id}`)}
                        className="btn-secondary text-sm px-3 py-1 flex items-center"
                      >
                        View Details
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
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

export default DoctorPrescriptionsPage; 