import { postObjectAsJson } from './modulejson.js';

document.getElementById('openRegister').addEventListener('click', () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('or').remove();
    document.getElementById('openRegister').remove();
});


document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await postObjectAsJson(
        'login',
        { email, password }
    );

    if (response.ok) {
        document.getElementById('message').textContent = 'Succesfuld log ind!';
        window.location.href = 'index.html';
    } else {
        document.getElementById('message').textContent = 'Forkert email eller password';
    }
});
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(document.getElementById('registerForm'));
    const plainFormData = Object.fromEntries(formData.entries());

    console.log('Register data:', plainFormData);

    try {
        const response = await postObjectAsJson('register-customer', plainFormData);

        if (response.ok) {
            document.getElementById('message').textContent = 'Profil oprettet!';
            document.getElementById('registerForm').style.display = 'none';
            const loginForm = document.getElementById('loginForm');
            if (loginForm) loginForm.style.display = 'block';
        } else {
            const errorText = await response.text();
            document.getElementById('message').textContent = 'Kunne ikke oprette profil: ' + errorText;
        }
    } catch (err) {
        console.error('Fejl ved oprettelse af bruger:', err);
        document.getElementById('message').textContent = 'Fejl ved oprettelse af profil.';
    }
});
