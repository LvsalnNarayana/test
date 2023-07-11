// Example updateData object for updating user data
const updateData = {
    username: 'newUsername',
    email: 'newemail@example.com',
    bio: 'Updated user bio',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    mobile: '1234567890',
    country: 'USA',
    livesIn: 'New York',
    from: 'California',
    education: [
        {
            school: 'University A',
            degree: 'Bachelor',
            fieldOfStudy: 'Computer Science',
            yearStarted: 2010,
            yearCompleted: 2014,
        },
        {
            school: 'University B',
            degree: 'Master',
            fieldOfStudy: 'Business Administration',
            yearStarted: 2015,
            yearCompleted: 2017,
        },
    ],
    work: [
        {
            company: 'Company A',
            position: 'Software Engineer',
            yearStarted: 2014,
            yearEnded: 2018,
        },
        {
            company: 'Company B',
            position: 'Product Manager',
            yearStarted: 2019,
            yearEnded: null, // Ongoing
        },
    ],
    placesCheckedIn: [
        {
            name: 'Restaurant A',
            location: 'New York',
            checkInDate: new Date('2022-07-01'),
        },
        {
            name: 'Hotel B',
            location: 'California',
            checkInDate: new Date('2022-08-15'),
        },
    ],
};


