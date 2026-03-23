document.getElementById('form').addEventListener('submit', function(event)
{
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phoneNumberInput = document.getElementById('phone');
    const messageDiv = document.getElementById('MessageDiv');
    const phoneNumber = phoneNumberInput.value.trim();
    const errorElement = document.getElementById('phoneError');


     // Regular expression for common Nigerian phone number formats
    // Matches: 070/080/081/090/091 followed by 8 digits OR +234 followed by 10 digits
    const nigerianPhoneRegex = /^(0[789][01]\d{8}|\+234[789][01]\d{8})$/;

    messageDiv.className = 'error-message';

    if (name === "" || email === "" || phoneNumber === "") {
        messageDiv.textContent = 'Please fill in all fields';
        return;
    }

     if (email.length < 14) {
        messageDiv.textContent = 'Email must be at least 14 characters';
        return;
    }

    if (nigerianPhoneRegex.test(phoneNumber)) {
        // Number is valid
        errorElement.style.display = 'none';
        alert('Valid Nigerian Phone Number: ' + phoneNumber);
        //Here you can proceed with form submission to a server
        // e.g., 
        this.submit(); //This will submit the form
    } else {
        // Number is invalid
        errorElement.style.display = 'inline';
        messageDiv.textContent ='Please enter a valid Nigerian phone number';
    }
}); 

document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const form = document.getElementById('form');
        // Check if form exists and is visible;
        if (form && form.style.display !== 'none') {
            form.dispatchEvent(new Event('submit'));
        }
    }
}); 