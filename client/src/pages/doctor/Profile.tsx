import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { 
  UserCircleIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  IdentificationIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface DoctorProfile {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  qualifications: string;
  experience: string;
  bio: string;
  profilePicture?: string;
}

const Profile = () => {
  const { user, token } = useContext(AuthContext);
  const [profile, setProfile] = useState<DoctorProfile>({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualifications: '',
    experience: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // In a real application, this would be an actual API call
        // For now, we'll use mock data
        const mockProfile: DoctorProfile = {
          name: user?.name || 'John Doe',
          email: user?.email || 'doctor@example.com',
          phone: '+1 (555) 123-4567',
          specialization: 'Cardiology',
          qualifications: 'MD, MBBS, Cardiology Specialist',
          experience: '10 years',
          bio: 'Experienced cardiologist with a focus on preventative care and heart health management. Specializes in diagnosis and treatment of complex cardiovascular conditions.',
          profilePicture: 'https://randomuser.me/api/portraits/men/42.jpg'
        };
        
        setProfile(mockProfile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // In a real app, this would be an API call to save the profile
      // For demo purposes, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
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
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-secondary-900">
            Doctor Profile
          </h1>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {editing ? 'Cancel' : (
              <>
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Edit Profile
              </>
            )}
          </button>
        </div>
        
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
                <div className="relative">
                  <img
                    src={profile.profilePicture || 'https://via.placeholder.com/150'}
                    alt={profile.name}
                    className="h-32 w-32 rounded-full object-cover ring-4 ring-primary-100"
                  />
                  {editing && (
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-primary-600 text-white p-1 rounded-full"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-secondary-900">{profile.name}</h2>
                <p className="text-primary-600 font-medium">{profile.specialization}</p>
              </div>
              
              <div className="md:w-2/3 md:pl-6">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-medium text-secondary-800 flex items-center">
                      <IdentificationIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Basic Information
                    </h3>
                    <div className="mt-3 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                          Full Name
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={profile.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        ) : (
                          <p className="mt-1 text-secondary-800">{profile.name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="specialization" className="block text-sm font-medium text-secondary-700">
                          Specialization
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            name="specialization"
                            id="specialization"
                            value={profile.specialization}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        ) : (
                          <p className="mt-1 text-secondary-800">{profile.specialization}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
                          Email
                        </label>
                        {editing ? (
                          <div className="flex items-center mt-1">
                            <EnvelopeIcon className="h-5 w-5 text-secondary-400 mr-2" />
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={profile.email}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center mt-1">
                            <EnvelopeIcon className="h-5 w-5 text-secondary-400 mr-2" />
                            <span className="text-secondary-800">{profile.email}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-secondary-700">
                          Phone
                        </label>
                        {editing ? (
                          <div className="flex items-center mt-1">
                            <PhoneIcon className="h-5 w-5 text-secondary-400 mr-2" />
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              value={profile.phone}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center mt-1">
                            <PhoneIcon className="h-5 w-5 text-secondary-400 mr-2" />
                            <span className="text-secondary-800">{profile.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Qualifications */}
                  <div className="pt-4 border-t border-secondary-200">
                    <h3 className="text-lg font-medium text-secondary-800 flex items-center">
                      <AcademicCapIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Qualifications
                    </h3>
                    <div className="mt-3">
                      <label htmlFor="qualifications" className="block text-sm font-medium text-secondary-700">
                        Degrees and Certifications
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="qualifications"
                          id="qualifications"
                          value={profile.qualifications}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      ) : (
                        <p className="mt-1 text-secondary-800">{profile.qualifications}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Experience */}
                  <div className="pt-4 border-t border-secondary-200">
                    <h3 className="text-lg font-medium text-secondary-800 flex items-center">
                      <BriefcaseIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Professional Experience
                    </h3>
                    <div className="mt-3">
                      <label htmlFor="experience" className="block text-sm font-medium text-secondary-700">
                        Years of Experience
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="experience"
                          id="experience"
                          value={profile.experience}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      ) : (
                        <p className="mt-1 text-secondary-800">{profile.experience}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Bio */}
                  <div className="pt-4 border-t border-secondary-200">
                    <h3 className="text-lg font-medium text-secondary-800 flex items-center">
                      <UserCircleIcon className="h-5 w-5 mr-2 text-primary-600" />
                      About Me
                    </h3>
                    <div className="mt-3">
                      <label htmlFor="bio" className="block text-sm font-medium text-secondary-700">
                        Professional Bio
                      </label>
                      {editing ? (
                        <textarea
                          id="bio"
                          name="bio"
                          rows={4}
                          value={profile.bio}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      ) : (
                        <p className="mt-1 text-secondary-800">{profile.bio}</p>
                      )}
                    </div>
                  </div>
                  
                  {editing && (
                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          'Save Profile'
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