import axios from 'axios';

const API_URL = 'http://localhost:3001/api'; // Adjust if needed

async function reproduce() {
  console.log('Testing for duplicate phone number registration...');

  const user1 = {
    firstName: 'User',
    lastName: 'One',
    email: 'user1@example.com',
    phone: '+1234567890',
    password: 'Password123!',
    role: 'Customer'
  };

  const user2 = {
    firstName: 'User',
    lastName: 'Two',
    email: 'user2@example.com',
    phone: '+1234567890', // Duplicate phone
    password: 'Password123!',
    role: 'Customer'
  };

  try {
    // Note: Registration currently requires OTP verification in this project.
    // This script might need to bypass OTP if we're testing the service directly,
    // or we can test the request-otp endpoint which should also check for duplicates.
    
    console.log('Requesting OTP for User 1...');
    await axios.post(`${API_URL}/auth/register/owner/request-otp`, {
      firstName: user1.firstName,
      lastName: user1.lastName,
      email: user1.email,
      phone: user1.phone,
      role: 'Owner'
    });
    console.log('OTP requested for User 1');

    console.log('Requesting OTP for User 2 with SAME phone...');
    const response = await axios.post(`${API_URL}/auth/register/owner/request-otp`, {
      firstName: user2.firstName,
      lastName: user2.lastName,
      email: user2.email,
      phone: user2.phone,
      role: 'Owner'
    });

    console.log('Response status for User 2:', response.status);
    console.log('If this succeeded (200), then duplicate phone numbers are allowed.');

  } catch (error) {
    if (error.response) {
      console.log('Caught expected error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

reproduce();
