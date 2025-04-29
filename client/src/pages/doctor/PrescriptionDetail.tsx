import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PrinterIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface Prescription {
  _id: string;
  doctor: {
    _id: string;
    name: string;
    specialization: string;
    profilePicture?: string;
  };
  patient: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
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

const DoctorPrescriptionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await axios.get(`/api/prescriptions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPrescription(res.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching prescription');
        setLoading(false);
      }
    };
    
    if (id && token) {
      fetchPrescription();
    }
  }, [id, token]);
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" /> Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800 flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1" /> Accepted
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1" /> Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 flex items-center">
            <XCircleIcon className="h-4 w-4 mr-1" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error || !prescription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error || 'Prescription not found'}
        </div>
        <button
          onClick={() => navigate('/doctor/prescriptions')}
          className="btn-primary flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Prescriptions
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 print:py-0 print:px-0">
      <div className="no-print mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/doctor/prescriptions')}
          className="btn-secondary flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Prescriptions
        </button>
        
        <div className="flex items-center space-x-3">
          {prescription.status === 'completed' && (
            <>
              <button
                onClick={() => navigate(`/doctor/prescriptions/edit/${prescription._id}`)}
                className="btn-secondary flex items-center"
              >
                <PencilSquareIcon className="h-5 w-5 mr-1" />
                Edit
              </button>
              
              <button
                onClick={handlePrint}
                className="btn-primary flex items-center"
              >
                <PrinterIcon className="h-5 w-5 mr-1" />
                Print
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-secondary-200 print:border-none print:shadow-none">
        {/* Prescription Header */}
        <div className="border-b border-secondary-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-secondary-900 flex items-center">
                <DocumentTextIcon className="h-7 w-7 text-primary-600 mr-2" />
                Prescription
              </h1>
              <p className="text-secondary-600 mt-1">ID: #{prescription._id.slice(-6)}</p>
            </div>
            
            <div className="mt-4 md:mt-0 print:hidden">
              {getStatusBadge(prescription.status)}
            </div>
          </div>
        </div>
        
        {/* Doctor and Patient Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-secondary-200">
          <div>
            <h3 className="text-sm font-medium text-secondary-500 uppercase mb-2">Doctor</h3>
            <p className="text-lg font-medium text-secondary-900">Dr. {prescription.doctor.name}</p>
            <p className="text-secondary-600">{prescription.doctor.specialization}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-secondary-500 uppercase mb-2">Patient</h3>
            <p className="text-lg font-medium text-secondary-900">{prescription.patient.name}</p>
            <p className="text-secondary-600">{prescription.patient.email}</p>
          </div>
        </div>
        
        {/* Prescription Details */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-secondary-500 uppercase mb-2">Date</h3>
            <p className="text-secondary-900">{formatDate(prescription.createdAt)}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-secondary-500 uppercase mb-2">Patient's Symptoms</h3>
            <p className="text-secondary-900 whitespace-pre-line">{prescription.symptoms}</p>
          </div>
          
          {prescription.diagnosis && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-secondary-500 uppercase mb-2">Diagnosis</h3>
              <p className="text-secondary-900 whitespace-pre-line">{prescription.diagnosis}</p>
            </div>
          )}
          
          {prescription.medications && prescription.medications.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-secondary-500 uppercase mb-2">Medications</h3>
              <div className="bg-secondary-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Medication
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Dosage
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {prescription.medications.map((med, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-secondary-900">{med.name}</td>
                        <td className="px-4 py-3 text-sm text-secondary-900">{med.dosage}</td>
                        <td className="px-4 py-3 text-sm text-secondary-900">{med.frequency}</td>
                        <td className="px-4 py-3 text-sm text-secondary-900">{med.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Medication Notes */}
              {prescription.medications.some(med => med.notes) && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-secondary-700 mb-2">Notes</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {prescription.medications
                      .filter(med => med.notes)
                      .map((med, index) => (
                        <li key={index} className="text-sm text-secondary-700">
                          <span className="font-medium">{med.name}:</span> {med.notes}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {prescription.additionalNotes && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-secondary-500 uppercase mb-2">Additional Instructions</h3>
              <p className="text-secondary-900 whitespace-pre-line">{prescription.additionalNotes}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-secondary-200 p-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-secondary-500">
              This prescription was issued digitally via DocConnect.
            </p>
            <div className="text-right text-sm text-secondary-500">
              <p>Issued: {formatDate(prescription.createdAt)}</p>
              {prescription.updatedAt !== prescription.createdAt && (
                <p>Updated: {formatDate(prescription.updatedAt)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescriptionDetailPage; 