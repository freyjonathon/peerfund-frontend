useEffect(() => {
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`, // token from localStorage
  },
  body: JSON.stringify(profileData),
});

      setProfile({
        name: data.name || '',
        location: data.location || '',
        summary: data.summary || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  fetchProfile();
}, []);
