document.getElementById('loginForm').addEventListener('submit', function(event) {
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const errorMsg = document.getElementById('errorMsg');
    const messageDiv = document.getElementById('message');

    // Clear previous messages
    messageDiv.className = 'error-message';
    if (errorMsg) errorMsg.style.display = 'none';

    // Validation
    if (email === '' || password === '' ) {
        messageDiv.textContent = 'Please fill in all fields';
        return;
    }

    if (email.length < 14) {
        messageDiv.textContent = 'Email must be at least 14 characters';
        return;
    }

   // Regex for phone (simple 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    
   if (!phoneRegex.test(phone)) {
    if(errorMsg) {
        errorMsg.style.display = 'block';
    errorMsg.innerText = 'Phone number must be 10 digits.';
    }
    return; // Stop if phone is invalid
   } else {
    if (errorMsg)errorMsg.style.display = 'none';
    alert("phone number Validated!")
   }

   // Demo credentials (in real app, this would be server-side)
    const validEmail = 'demo@example.com';
    const validphone = '1234567890'; // Added valid phone


    
   // Check credentials
    if (email === validEmail && phone === validPhone) {
        messageDiv.className = 'success-message';
        messageDiv.textContent = 'Login Successful! Redirecting...'; 

        setTimeout(() => {
            alert('Welcome, ' + email + '!');
        }, 2000);

    } else {
        messageDiv.textContent = 'Invalid Email or Phone Number';
    }
});
// Allow Enter key to submit
document.addEventListener('keypress', function(event){
    if (event.key === 'Enter') {
        login();
    }
});
