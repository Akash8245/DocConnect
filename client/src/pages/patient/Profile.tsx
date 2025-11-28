import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { 
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  XCircleIcon,
  CheckCircleIcon,
  CameraIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

interface PatientProfile {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
  profilePicture?: string;
  about?: string;
}

const Profile = () => {
  const { user, token, updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState<PatientProfile>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    profilePicture: user?.profilePicture || '',
    about: ''
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!token) return;
        
        // Set up axios headers
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        // Fetch user profile from API
        const response = await axios.get('/api/auth/user', config);
        
        if (response.data) {
          setProfile({
            name: response.data.name || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            dateOfBirth: response.data.dateOfBirth || '',
            gender: response.data.gender || '',
            address: response.data.address || '',
            emergencyContact: response.data.emergencyContact || '',
            medicalHistory: response.data.medicalHistory || '',
            allergies: response.data.allergies || '',
            currentMedications: response.data.currentMedications || '',
            profilePicture: response.data.profilePicture || '',
            about: response.data.about || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      if (!token) return;
      
      // Set up axios headers
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Send profile update to API
      const response = await axios.put('/api/auth/profile', profile, config);
      
      if (response.data) {
        // Update the global user context if available
        if (updateUser) {
          updateUser({
            ...user,
            name: response.data.name,
            email: response.data.email,
            profilePicture: response.data.profilePicture
          });
        }
        
        setEditing(false);
        setSuccessMessage('Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const displayValue = (value: string) => {
    return value || 'Not specified';
  };

  // Get user initials from name
  const getUserInitials = (name: string) => {
    if (!name) return '';
    
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length === 0) return '';
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Handle clicking the profile picture upload button
  const handleProfilePictureClick = () => {
    if (editing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB');
      return;
    }
    
    try {
      setUploadingImage(true);
      setError('');
      
      // Create FormData object to send file
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      // In a real implementation, you would upload the file to your server
      // For this demo, we'll simulate a delay and use FileReader to get a data URL
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageDataUrl = event.target?.result as string;
        
        // Update profile state with new image
        setProfile(prev => ({
          ...prev,
          profilePicture: imageDataUrl
        }));
        
        // Simulate API upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUploadingImage(false);
      };
      
      reader.readAsDataURL(file);
      
      // In a real implementation, you would make an API call like this:
      /*
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await axios.post('/api/auth/upload-profile-picture', formData, config);
      
      if (response.data && response.data.profilePicture) {
        setProfile(prev => ({
          ...prev,
          profilePicture: response.data.profilePicture
        }));
        
        // Update global user context
        if (updateUser) {
          updateUser({
            ...user,
            profilePicture: response.data.profilePicture
          });
        }
      }
      
      setUploadingImage(false);
      */
      
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError('Failed to upload profile picture. Please try again.');
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
            <UserCircleIcon className="h-8 w-8 mr-2 text-primary-600" />
            My Profile
          </h1>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
              editing 
                ? 'text-secondary-700 bg-white hover:bg-gray-50 border-gray-300' 
                : 'text-white bg-primary-600 hover:bg-primary-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200`}
          >
            {editing ? (
              <>
                <XCircleIcon className="h-5 w-5 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Edit Profile
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-1 text-sm text-green-700">
                  <p>{successMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 bg-white shadow rounded-xl overflow-hidden border border-gray-100">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 flex flex-col items-center mb-8 md:mb-0">
                <div className="relative group">
                  {/* Hidden file input */}
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <div 
                    className="rounded-full overflow-hidden h-36 w-36 ring-4 ring-primary-50 shadow-md cursor-pointer"
                    onClick={handleProfilePictureClick}
                  >
                    {profile.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-primary-600 flex items-center justify-center text-white text-4xl font-semibold">
                        {getUserInitials(profile.name)}
                      </div>
                    )}
                    
                    {/* Overlay when uploading */}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  
                  {editing && (
                    <button
                      type="button"
                      onClick={handleProfilePictureClick}
                      className="absolute bottom-2 right-2 bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <CameraIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <h2 className="mt-6 text-2xl font-bold text-secondary-900">{profile.name}</h2>
                <p className="text-secondary-600 flex items-center mt-1">
                  <UserIcon className="h-4 w-4 mr-1 text-primary-600" /> 
                  Patient
                </p>
                
                <div className="mt-6 w-full max-w-xs bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="font-medium text-secondary-800 mb-3">Quick Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <EnvelopeIcon className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-secondary-500">Email</p>
                        <p className="text-sm text-secondary-800">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <PhoneIcon className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-secondary-500">Phone</p>
                        <p className="text-sm text-secondary-800">{displayValue(profile.phone)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CalendarDaysIcon className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-secondary-500">Date of Birth</p>
                        <p className="text-sm text-secondary-800">
                          {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:w-2/3 md:pl-8 md:border-l border-gray-100">
                <div className="space-y-8">
                  {/* Basic Info */}
                  <div className="bg-white rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-800 flex items-center border-b border-gray-100 pb-3 mb-4">
                      <IdentificationIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-secondary-700">
                          Full Name
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={profile.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        ) : (
                          <p className="mt-1 text-secondary-800 py-2">{displayValue(profile.name)}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="gender" className="block text-sm font-semibold text-secondary-700">
                          Gender
                        </label>
                        {editing ? (
                          <select
                            id="gender"
                            name="gender"
                            value={profile.gender}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        ) : (
                          <p className="mt-1 text-secondary-800 py-2">{displayValue(profile.gender)}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-secondary-700">
                          Date of Birth
                        </label>
                        {editing ? (
                          <input
                            type="date"
                            name="dateOfBirth"
                            id="dateOfBirth"
                            value={profile.dateOfBirth}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        ) : (
                          <p className="mt-1 text-secondary-800 py-2">
                            {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not specified'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-secondary-700">
                          Phone
                        </label>
                        {editing ? (
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              value={profile.phone}
                              onChange={handleInputChange}
                              className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              placeholder="+91 (555) 123-4567"
                            />
                          </div>
                        ) : (
                          <p className="mt-1 text-secondary-800 py-2">{displayValue(profile.phone)}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="address" className="block text-sm font-semibold text-secondary-700">
                          Address
                        </label>
                        {editing ? (
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                              type="text"
                              name="address"
                              id="address"
                              value={profile.address}
                              onChange={handleInputChange}
                              className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              placeholder="123 Main St, Anytown, CA 12345"
                            />
                          </div>
                        ) : (
                          <p className="mt-1 text-secondary-800 py-2">{displayValue(profile.address)}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="emergencyContact" className="block text-sm font-semibold text-secondary-700">
                          Emergency Contact
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            name="emergencyContact"
                            id="emergencyContact"
                            value={profile.emergencyContact}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="Name (Relationship) - Phone"
                          />
                        ) : (
                          <p className="mt-1 text-secondary-800 py-2">{displayValue(profile.emergencyContact)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Medical Info */}
                  <div className="bg-white rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-800 flex items-center border-b border-gray-100 pb-3 mb-4">
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Medical Information
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <label htmlFor="medicalHistory" className="block text-sm font-semibold text-secondary-700">
                          Medical History
                        </label>
                        {editing ? (
                          <textarea
                            id="medicalHistory"
                            name="medicalHistory"
                            rows={3}
                            value={profile.medicalHistory}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="List any past medical conditions or surgeries"
                          />
                        ) : (
                          <p className="mt-1 text-secondary-800 bg-gray-50 p-3 rounded-md">
                            {displayValue(profile.medicalHistory)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="allergies" className="block text-sm font-semibold text-secondary-700">
                          Allergies
                        </label>
                        {editing ? (
                          <textarea
                            id="allergies"
                            name="allergies"
                            rows={2}
                            value={profile.allergies}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="List any drug or food allergies"
                          />
                        ) : (
                          <p className="mt-1 text-secondary-800 bg-gray-50 p-3 rounded-md">
                            {displayValue(profile.allergies)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="currentMedications" className="block text-sm font-semibold text-secondary-700">
                          Current Medications
                        </label>
                        {editing ? (
                          <textarea
                            id="currentMedications"
                            name="currentMedications"
                            rows={3}
                            value={profile.currentMedications}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="List all medications you're currently taking with dosage"
                          />
                        ) : (
                          <p className="mt-1 text-secondary-800 bg-gray-50 p-3 rounded-md">
                            {displayValue(profile.currentMedications)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {editing && (
                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Save Profile
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 